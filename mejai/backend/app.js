const express = require('express')
const app = express()
const path = require('path')
const Mejai = require('./Mejai')
const mejai = new Mejai();
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/mejaiDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("DB Connection Open"))
    .catch((error) => console.log("DB ERROR", error))

const mejaiSchema = new mongoose.Schema({
    accountId: String,
    matchId: Number,
    stacks: [Number],
    timeline: [Number]
})

const MejaiData = mongoose.model('MejaiData', mejaiSchema)


app.set('views', path.join(__dirname, '../frontend-ejs'));
app.set('view engine', 'ejs');

// app.get('/', (req, res) => {
//     console.log('main page requested');
//     mejai.main()
//         .then(response => {
//             console.log(response);
//             res.render('index', { data: response })
//         })
//         .catch(error => console.log(error.message))
// })

app.get('/loadMatches', (req, res) => {
    MejaiData.find()
    .then(data => console.log(data))
})

app.get('/saveMatches', (req, res) => {
    mejai.main()
        .then(response => {
            response.forEach(dataSet => {
                //check if the game is already in the database
                MejaiData.find({accountId: dataSet.accountId, matchId: dataSet.matchId})
                .then(queryResults => {
                    if(queryResults.length == 0) {
                        const entry = new MejaiData(dataSet)
                        entry.save()
                        console.log(entry);
                    }
                })
            })
            res.render('index', { data: response })
        })
})


app.listen(5000, () => {
    console.log('Server is running');
});