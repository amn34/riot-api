const axios = require('axios');
require('dotenv').config();

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

/**Information for the user to search */
const summonerName = 'w%20poseidon%20w';
const summonerID = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU';
const accountID = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';

/**item id*/
const mejaiID = 3041;
const darkSealID = 1082;

let currStacks = 0;
let isStacking = false;
let boughtMejai = false;

const matches = [];

main();




async function main() {
    const games = await getMatchesByID(accountID);
    filterGames(games);

    for (let i = 0; i < 40; i++) {
        reset();
        const matchID = matches[i].gameId;
        const participantID = await getParticipantID(matchID);
        const stacks = await getStacks(matchID, participantID).catch(error => console.log(error));
        console.log(matchID + ":");
        console.log(stacks);
    }
}

/**
 * Resets the stack information to default
 */
function reset() {
    currStacks = 0;
    isStacking = false;
    boughtMejai = false;
}

/**
 * Checks if a player bought the specified item.
 * @param {MatchEventDto} event 
 * @param {int} itemID 
 * @param {int} participantID 
 */
function boughtItem(event, itemID, participantID) {
    if (event.type == 'ITEM_PURCHASED' && event.participantId == participantID) {
        return event.itemId == itemID;
    }
}

/**
 * Checks if the sold the specified item
 * @param {MatchEventDto} event 
 * @param {int} itemID 
 * @param {int} participantID 
 */
function soldItem(event, itemID, participantID) {
    if (event.type == 'ITEM_SOLD' && event.participantId == participantID) {
        return event.itemId == itemID;
    }
}

/**
 * Return whether the event was a kill event
 * @param {MatchEventDto} event 
 */
function championKill(event) {
    return isStacking && event.type == 'CHAMPION_KILL'
}


/**
 * Gets the stacks the player earned in the game
 * @param {int} matchID 
 * @param {int} participantID 
 */
async function getStacks(matchID, participantID) {
    const frames = (await axios.get(`https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${matchID}`, headers)).data.frames;
    const stacks = [0];
    frames.forEach(frame => {
        frame.events.forEach(event => {
            if (boughtItem(event, mejaiID, participantID)) {
                isStacking = true;
                boughtMejai = true;
            }
            else if(boughtItem(event, darkSealID, participantID)) {
                isStacking = true;
            }
            else if(soldItem(event, mejaiID, participantID)) {
                isStacking = false;
                boughtMejai = false;
                stacks.push(0);
            }
            else if(soldItem(event, darkSealID, participantID)) {
                isStacking = false;
                stacks.push(0);
            }
            else if(isStacking && championKill(event)) {
                if(event.killerId == participantID) {
                    currStacks += boughtMejai ? 4 : 2;
                    currStacks = boughtMejai ? Math.min(currStacks, 25) : Math.min(currStacks, 10);    
                    stacks.push(currStacks);
                } else if(event.victimId == participantID) {
                    currStacks -= boughtItem ? 10: 4;
                    currStacks = Math.max(currStacks, 0);
                    stacks.push(currStacks);
                } else if(event.assistingParticipantIds.includes(participantID)) {
                    currStacks += boughtMejai ? 2: 1;
                    currStacks = boughtMejai ? Math.min(currStacks, 25) : Math.min(currStacks, 10);    
                    stacks.push(currStacks);
                }
               
            }
        });
    });
    return stacks;
}

/**
 * Gets the participant ID of the player for a specified game
 * @param {int} matchID 
 */
async function getParticipantID(matchID) {
    try {
        const response = await axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchID}`, headers);
        const participants = response.data.participantIdentities;
        return getID(participants);
    } catch (error) {
        console.log(error);
    }
}

/**
 * Goes through the participants and returns the id of the desired participant
 * @param {List[ParticipantIdentityDto]} participants 
 */
function getID(participants) {
    let id = -1;
    participants.forEach(part => {
        if (part.player.summonerId === summonerID) {
            id = part.participantId;
        }
    });
    if (id === -1) throw 'Player not found';
    return id;
}


/**
 * Gets the last 100 games played by the specified account
 * @param {int} accountID 
 */
async function getMatchesByID(accountID) {
    try {
        const response = await axios.get(`https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountID}`, headers)
        return response.data.matches;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Filters out MID/SUPPORT games from the previous 100 games played
 * @param {List[MatchReferenceDto]} games 
 */
function filterGames(games) {
    games.forEach(game => {
        if (game.role == "DUO_SUPPORT" || game.lane === "MID") {
            matches.push(game);
        }
    });
}
