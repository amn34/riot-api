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


class Mejai {

    currStacks = 0;
    isStacking = false;
    boughtMejai = false;

    matches = [];

    async getStacks(matchID, participantID) {
        const frames = (await axios.get(`https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${matchID}`, headers)).data.frames;
        const stacks = [0];
        frames.forEach(frame => {
            frame.events.forEach(event => {
                if (this.boughtItem(event, mejaiID, participantID)) {
                    this.isStacking = true;
                    this.boughtMejai = true;
                }
                else if (this.boughtItem(event, darkSealID, participantID)) {
                    this.isStacking = true;
                }
                else if (this.soldItem(event, mejaiID, participantID)) {
                    this.isStacking = false;
                    this.boughtMejai = false;
                    stacks.push(0);
                }
                else if (this.soldItem(event, darkSealID, participantID)) {
                    this.isStacking = false;
                    stacks.push(0);
                }
                else if (this.isStacking && this.championKill(event)) {
                    if (event.killerId == participantID) {
                        this.currStacks += this.boughtMejai ? 4 : 2;
                        this.currStacks = this.boughtMejai ? Math.min(this.currStacks, 25) : Math.min(this.currStacks, 10);
                        stacks.push(this.currStacks);
                    } else if (event.victimId == participantID) {
                        this.currStacks -= this.boughtMejai ? 10 : 4;
                        this.currStacks = Math.max(this.currStacks, 0);
                        stacks.push(this.currStacks);
                    } else if (event.assistingParticipantIds.includes(participantID)) {
                        this.currStacks += this.boughtMejai ? 2 : 1;
                        this.currStacks = this.boughtMejai ? Math.min(this.currStacks, 25) : Math.min(this.currStacks, 10);
                        stacks.push(this.currStacks);
                    }
                }
            });
        });
        return stacks;
    }

    championKill(event) {
        return this.isStacking && event.type == 'CHAMPION_KILL'
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


    reset() {
        this.currStacks = 0;
        this.isStacking = false;
        this.boughtMejai = false;
    }

    async getParticipantID(matchID) {
        try {
            const response = await axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchID}`, headers);
            const participants = response.data.participantIdentities;
            return this.getID(participants);
        } catch (error) {
            console.log(error);
        }
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

    async getMatchesByID(accountID) {
        try {
            const response = await axios.get(`https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountID}`, headers)
            return response.data.matches;
        } catch (error) {
            console.log(error);
        }
    }

    filterGames(games) {
        games.forEach(game => {
            if (game.role == "DUO_SUPPORT" || game.lane === "MID") {
                this.matches.push(game);
            }
        });
    }



    async main() {
        const games = await this.getMatchesByID(accountID);
        this.filterGames(games);

        const data = [];

        for (let i = 0; i < 40; i++) {
            this.reset();
            const matchID = this.matches[i].gameId;
            const participantID = await this.getParticipantID(matchID);
            const stacks = await this.getStacks(matchID, participantID).catch(error => console.log(error));
            // console.log(matchID + ":");
            // console.log(stacks);
            data.push({
                matchID: matchID,
                stacks: stacks
            });
        }
        console.log('matches loaded');
        return data;
    }
}

module.exports = Mejai;