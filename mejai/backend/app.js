const express = require('express')
const app = express()
const path = require('path')
const MejaiLoader = require('./MejaiLoader')
const mejaiLoader = new MejaiLoader()
//mongodb schema for mejai data 
const Mejai = require('./MejaiSchema')


app.set('views', path.join(__dirname, '../frontend-ejs'));
app.set('view engine', 'ejs');


app.get('/mejai', (req, res) => {
    console.log("---------------------------")
    console.log("Loading Mejai Games from DB")
    console.log("---------------------------")
    Mejai.find({boughtMejai: true})
    .then(results => {
        console.log(results);
        console.log("---------------------------")
        console.log("Finished Loading Mejai Games from DB")
        console.log("---------------------------")
        res.render('index', { data: results })
    })
})

app.get('/stacks', (req, res) => {
    mejaiLoader.load()
        .then(response => {
            response.forEach(dataSet => {
                const entry = new Mejai(dataSet)
                entry.save()
                console.log(entry);
            })
            res.send({success: true});
        })
})

app.get('/all', (req, res) => {
    Mejai.find()
    .then(queryResults => {
        console.log(queryResults)
        console.log(queryResults.length);
    })
    .catch(error => {
        console.log(error);
    })
})


app.listen(5000, () => {
    console.log('Server is running');
});