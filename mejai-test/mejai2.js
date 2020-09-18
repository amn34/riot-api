const axios = require('axios');
require('dotenv').config();

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

const summonerName = 'w%20poseidon%20w';
const summonerID = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU';
const accountID = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';

const matchID = '3575217738';

const mejaiID = 3041;
const darkSealID = 1082;

const stacks = [0];
let currStacks = 0;
let isStacking = false;
let boughtMejai = false;

const matches = [];

main();




async function main() {
    const games = await getMatchesByID(accountID);
    filterGames(games);

    //20 max request from riot
    for (let i = 0; i < 10; i++) {
        const matchID = matches[i].gameId;
        const participantID = await getParticipantID(matchID);
        const stacks = await getStacks(matchID, participantID);
    }
}

async function getStacks(matchID, participantID) {
    const frames = (await axios.get(`https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${matchID}`, headers)).data.frames;
    frames.forEach(frame => {
        frame.events.forEach(event => {
            boughtItem(mejaiID, event);
            boughtItem(darkSealID, event);
            soldItem(mejaiID, event);
            championKill(event);
            championAssist(event);
            championDeath(event);
        });
    });
}


async function getParticipantID(matchID) {
    try {
        const response = await axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchID}`, headers);
        const participants = response.data.participantIdentities;
        return getID(participants);
    } catch (error) {
        console.log(error);
    }
}

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
