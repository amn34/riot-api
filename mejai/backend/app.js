const express = require('express')
const app = express()
const path = require('path')
const Mejai = require('./Mejai')
const mejai = new Mejai();

app.set('views', path.join(__dirname, '../frontend-ejs'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    console.log('main page requested');
    mejai.main()
        .then(response => {
            console.log(response);
            res.render('index', { data: response })
        })
        .catch(error => console.log(error.message))
})

app.get('/load', (req, res) => {
    mejai.main()
        .then(response => {
            console.log(response);
            res.render('index', { data: response })
        })
})


app.listen(5000, () => {
    console.log('Server is running');
});