require('dotenv').config();
const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("DB Connection Open"))
    .catch((error) => console.log("DB ERROR", error))

const mejaiSchema = new mongoose.Schema({
    accountId: String,
    matchId: Number,
    stacks: [Number],
    timeline: [Number],
    boughtMejai: Boolean
})
const Mejai = mongoose.model('MejaiData', mejaiSchema)

module.exports = Mejai;
