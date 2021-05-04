const axios = require('axios')
require('dotenv').config();

const headers = {
    params: {
        // "X-Riot-Token": process.env.RIOT_KEY
        "X-Riot-Token": "RGAPI-376eb005-d57c-45e2-8594-2b70aac01144"
        
    }
}

const accountId = 'nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc';

async function run() {
    try {
        const response = await axios.get("https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/nyYcx-xrknpMkEVMGTgnw_XfWWQezcmHWVHQuRghObAK1Sc", headers)
        console.log(response)
    } catch(error) {
        console.log(error.message)
    }

    
}

try {
    run()
} catch(error) {
    console.error('ERROR')
}
