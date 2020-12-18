const axios = require('axios');
const summonerName = 'w%20poseidon%20w';
const summonerId = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU';
const accountId = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';
require('dotenv').config();

/**item id*/
const mejaiId = 3041;
const darkSealId = 1082;

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

class Mejai {

    async getMatchesById(accountId, numMatches) {
        return axios.get(`https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountId}`, headers)
        .then(response => {
            return response.data.matches.slice(0, numMatches);
        })
        .catch(error => console.log(error.message))
    }

    filterMatches(matches) {
        matches.filter(match => match.lane == "DUO_SUPPORT" || match.lane === "MID");
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
        return {participantId: participantId, matchId: matchId, stacks, timeline};
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

    async main() {
        const matches = await this.getMatchesById(accountId, 5);
        this.filterMatches(matches);
        
        const dataPromises = matches.map(async match => {
            const stacks = await this.getStacks(match.gameId);
            return stacks;
        });
        let data = await Promise.all(dataPromises);
        data = data.filter(dataset => dataset.stacks.length > 1);
        return data;
    }
}

module.exports = Mejai;