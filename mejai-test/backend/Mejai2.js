const axios = require('axios');
const summonerName = 'w%20poseidon%20w';
const summonerID = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU';
const accountID = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';
require('dotenv').config();

/**item id*/
const mejaiID = 3041;
const darkSealID = 1082;

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

class Mejai2 {

    async getMatchesByID(accountID, numMatches) {
        return axios.get(`https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountID}`, headers)
        .then(response => {
            return response.data.matches.slice(0, numMatches);
        })
        .catch(error => console.log(error.message))
    }

    filterMatches(matches) {
        matches.filter(match => match.lane == "DUO_SUPPORT" || match.lane === "MID");
    }


    async getStacks(matchID) {        
        //get the participant id
        return axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchID}`, headers)
        .then(response => {
            const participants = response.data.participantIdentities;
            const participantID = this.getID(participants); 

            return axios.get(`https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${matchID}`, headers)
            .then(response => {
                return this.getMatchStacks(response.data.frames, participantID);
            })
            .catch(error => console.log(error.message))
        })
        .catch(error => console.log(error.message))

    }

    getID(participants) {
        let id = -1;
        participants.forEach(part => {
            if (part.player.summonerId === summonerID) {
                id = part.participantId;
            }
        });
        if (id === -1) throw 'Player not found';
        return id;
    }

    getMatchStacks(frames, participantID) {
        let currStacks = 0;
        let isStacking = false;
        let boughtMejai = false;

        const stacks = [0];
        const timeline = [0];
        frames.forEach(frame => {
            frame.events.forEach(event => {
                if (this.boughtItem(event, mejaiID, participantID)) {
                    isStacking = true;
                    boughtMejai = true;
                }
                else if (this.boughtItem(event, darkSealID, participantID)) {
                    isStacking = true;
                }
                else if (this.soldItem(event, mejaiID, participantID)) {
                    isStacking = false;
                    boughtMejai = false;
                    stacks.push(0);
                    timeline.push(frame.timestamp);
                }
                else if (this.soldItem(event, darkSealID, participantID)) {
                    isStacking = false;
                    stacks.push(0);
                    timeline.push(frame.timestamp);
                }
                else if (isStacking && this.championKill(event)) {
                    if (event.killerId == participantID) {
                        currStacks += boughtMejai ? 4 : 2;
                        currStacks = boughtMejai ? Math.min(currStacks, 25) : Math.min(currStacks, 10);
                        stacks.push(currStacks);
                        timeline.push(frame.timestamp);
                    } else if (event.victimId == participantID) {
                        currStacks -= boughtMejai ? 10 : 4;
                        currStacks = Math.max(currStacks, 0);
                        stacks.push(currStacks);
                        timeline.push(frame.timestamp);
                    } else if (event.assistingParticipantIds.includes(participantID)) {
                        currStacks += boughtMejai ? 2 : 1;
                        currStacks = boughtMejai ? Math.min(currStacks, 25) : Math.min(currStacks, 10);
                        stacks.push(currStacks);
                        timeline.push(frame.timestamp);
                    }
                }
            });
        });
        return {stacks, timeline};
    }

    championKill(event) {
        return event.type == 'CHAMPION_KILL'
    }
    soldItem(event, itemID, participantID) {
        if (event.type == 'ITEM_SOLD' && event.participantId == participantID) {
            return event.itemId == itemID;
        }
    }
    boughtItem(event, itemID, participantID) {
        if (event.type == 'ITEM_PURCHASED' && event.participantId == participantID) {
            return event.itemId == itemID;
        }
    }

    async main() {
        const matches = await this.getMatchesByID(accountID, 20);
        console.log('matches: ', matches);
        this.filterMatches(matches);
        
        const stackPromises = matches.map(async match => {
            const stacks = await this.getStacks(match.gameId);
            return stacks;
        });
        const stacks = await Promise.all(stackPromises);
        return stacks;
    }
}

module.exports = Mejai2;