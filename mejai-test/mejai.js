const axios = require('axios');
require('dotenv').config();

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

//joey
// const summonerName = 'w%20poseidon%20w';
// const summonerID = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU';
// const accountID = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';

//me
const summonerName = 'RuneSpiral';
const summonerID = 'cjwACoekaYmRH1QhSoIR9jM3WGFzUwV2Y3D8P5BpGNAxwAg';
const accountID = '3Jih8LZ4GBwDU69KBcWfUgkVGpvr3nNNRGeF1YXxcXFS81M';

const matchID = '3575217738';

const mejaiID = 3041;
const darkSealID = 1082;

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

function boughtItem(event, itemID, joeyID) {
    if (event.type == 'ITEM_PURCHASED' && event.participantId == joeyID) {
        return event.itemId == itemID;
    }
}

function soldItem(event, itemID, joeyID) {
    if (event.type == 'ITEM_SOLD' && event.participantId == joeyID) {
        return event.itemId == itemID;
    }
}

function getGameEvents(joeyID) {

    const stacks = [0];
    let currStacks = 0;
    let stacking = false;
    let mejai = false;

    axios.get(`https://na1.api.riotgames.com/lol/match/v4/timelines/by-match/${matchID}`, headers)
        .then(response => {
            const frames = response.data.frames;
            frames.forEach(frame => {
                frame.events.forEach(event => {
                    if (boughtItem(event, mejaiID, joeyID)) {
                        stacking = true;
                        mejai = true;
                        console.log('bought mejai');
                    } else if (boughtItem(event, darkSealID, joeyID)) {
                        stacking = true;
                        console.log('bought dark seal');
                    } else if (soldItem(event, mejaiID, joeyID)) {
                        console.log('sold mejai');
                        stacking = false;
                        currStacks = 0;
                        stacks.push(0);
                    } else if (stacking && event.type == 'CHAMPION_KILL') {
                        if (event.killerId == joeyID) {
                            currStacks += mejai ? 4 : 2;
                            currStacks = mejai ? Math.min(currStacks, 25): Math.min(currStacks, 10);
                            console.log(`Kill: ${currStacks}`);
                            stacks.push(currStacks);
                        } else if (event.victimId == joeyID) {
                            currStacks -= mejai ? 10 : 4;
                            currStacks = Math.max(currStacks, 0);
                            console.log(`Died: ${currStacks}`);
                            stacks.push(currStacks);
                        } else if (event.assistingParticipantIds.includes(joeyID)) {
                            currStacks += mejai ? 2 : 1;
                            currStacks = Math.min(currStacks, 25);
                            console.log(`Assist: ${currStacks}`);
                            stacks.push(currStacks);
                        }
                    }
                });
            });
            console.log(stacks);
        })
        .catch(error => {
            console.log(error);
        });
}

// axios.get(`https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountID}`, headers)
//     .then(response => {
//         console.log(response.data.matches.length);
//     })
//     .catch(error => {
//         console.log(error)
//     });


axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchID}`, headers)
    .then(response => {
        const participants = response.data.participantIdentities;
        const joeyID = getID(participants);
        getGameEvents(joeyID);
    })
    .catch(error => {
        console.log(error);
    })  