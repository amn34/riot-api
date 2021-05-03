const axios = require('axios');
/** w Poseidon w */
const summonerId = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU';
const accountId = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';
/** JustNothing69 */
// const summonerId = '7wmDX_WTATuRPxPAQKjiMERsdzpOK57nsYEHEQjB3tmXQ-4';
// const accountId = '9tkFkk2B5sDTzore-O9Ci86oK2-NTt37qLVd51hzN9sQfaE'

const Mejai = require('./MejaiSchema')

require('dotenv').config();

/**item id*/
const mejaiId = 3041;
const darkSealId = 1082;

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

class MejaiLoader {

    async getMatchesById(accountId, numMatches) {
        return axios.get(`https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountId}`, headers)
        .then(response => {
            return response.data.matches.slice(0, numMatches);
        })
        .catch(error => console.log(error.message))
    }

    async filterMatches(matches) {
        let filteredMatches = matches.map(async match => {
            return Mejai.find({accountId, matchId: match.gameId})
            .then(foundMatches => {
                if(foundMatches.length == 0) {
                    return match
                }
                console.log('match already processed');
                return
            })
            .catch(error => {
                console.log('Error searching for match in DB' , error)
            })
        })
        filteredMatches = await Promise.all(filteredMatches);
        filteredMatches = filteredMatches.filter(match => match !== undefined)
        return filteredMatches.slice(0, Math.min(10, filteredMatches.length))
    }


    async getStacks(matchId) {        
        //get the participant id
        return axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchId}`, headers)
        .then(response => {
            const participants = response.data.participantIdentities;
            const participantId = this.getId(participants); 
            return axios.get(`https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${matchId}`, headers)
            .then(response => {
                return this.getMatchStacks(response.data.frames, participantId, matchId);
            })
            .catch(error => console.log(error.message))
        })
        .catch(error => console.log(error.message))

    }

    getId(participants) {
        let id = -1;
        participants.forEach(part => {
            if (part.player.summonerId === summonerId) {
                id = part.participantId;
            }
        });
        if (id === -1) throw 'Player not found';
        return id;
    }

    getMatchStacks(frames, participantId, matchId) {
        let currStacks = 0;
        let isStacking = false;
        let boughtMejai = false;

        const stacks = [0];
        const timeline = [0];
        frames.forEach(frame => {
            frame.events.forEach(event => {
                if (this.boughtItem(event, mejaiId, participantId)) {
                    isStacking = true;
                    boughtMejai = true;
                }
                else if (this.boughtItem(event, darkSealId, participantId)) {
                    isStacking = true;
                }
                else if (this.soldItem(event, mejaiId, participantId)) {
                    isStacking = false;
                    boughtMejai = false;
                    stacks.push(0);
                    timeline.push(frame.timestamp);
                }
                else if (this.soldItem(event, darkSealId, participantId)) {
                    isStacking = false;
                    stacks.push(0);
                    timeline.push(frame.timestamp);
                }
                else if (isStacking && this.championKill(event)) {
                    if (event.killerId == participantId) {
                        currStacks += boughtMejai ? 4 : 2;
                        currStacks = boughtMejai ? Math.min(currStacks, 25) : Math.min(currStacks, 10);
                        stacks.push(currStacks);
                        timeline.push(frame.timestamp);
                    } else if (event.victimId == participantId) {
                        currStacks -= boughtMejai ? 10 : 4;
                        currStacks = Math.max(currStacks, 0);
                        stacks.push(currStacks);
                        timeline.push(frame.timestamp);
                    } else if (event.assistingParticipantIds.includes(participantId)) {
                        currStacks += boughtMejai ? 2 : 1;
                        currStacks = boughtMejai ? Math.min(currStacks, 25) : Math.min(currStacks, 10);
                        stacks.push(currStacks);
                        timeline.push(frame.timestamp);
                    }
                }
            });
        });
        return {accountId, matchId, stacks, timeline, boughtMejai};
    }

    championKill(event) {
        return event.type == 'CHAMPION_KILL'
    }
    soldItem(event, itemID, participantID) {
        if (event.type == 'ITEM_SOLD' && event.participantId == participantID) {
            return event.itemId == itemID;
        }
    }
    boughtItem(event, itemId, participantId) {
        if (event.type == 'ITEM_PURCHASED' && event.participantId == participantId) {
            return event.itemId == itemId;
        }
    }

    async load() {
        const matches = await this.getMatchesById(accountId, 30);
        const filteredMatches = await this.filterMatches(matches);
        const dataPromises = filteredMatches.map(async match => {
            const stacks = await this.getStacks(match.gameId);
            return stacks;
        });

        let data = await Promise.all(dataPromises);
        return data;
    }
}

module.exports = MejaiLoader;