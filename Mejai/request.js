const axios = require('axios');
require('dotenv').config();   

const headers = {
    params: {
        api_key: process.env.RIOT_KEY
    }
}

//joey
const summonerName = 'w%20poseidon%20w'; 
const summonerID = 'kr9yJ9GBEyZvzhtEs_Q53J5QVVddt94NFElRMNE8j_wXxnU'; 

const matchID = '3570259358';

function getID(participants) {
    let id = -1;
    participants.forEach(part => {
        if(part['player']['summonerId'] === summonerID) {
            id = part['participantId'];
        }
    });
    return id;
}


axios.get(`https://na1.api.riotgames.com/lol/match/v4/matches/${matchID}`, headers)
.then(response => {
    const participants = response.data.participantIdentities;
    const joeyID = getID(participants);
    if(joeyID !== -1) {
        console.log(joeyID);
    } else {
        throw "Player not found";
    }
}) 
.catch(error => {
    console.log(error);
})  