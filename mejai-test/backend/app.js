const express = require('express');
const app = express();
const Mejai = require('./Mejai');

const stacks = Mejai();

app.get('/', (req, res) => {
    res.send('welcome to main page');
})

app.get('/mejai', (req, res) => {
    res.send(stacks.getMatches());
});


app.listen(5000, () => {
    console.log('Server is running');
});