const express = require('express');
const app = express();
const Mejai = require('./Mejai');
const path = require('path');

const mejai = new Mejai();
const data = 
[
    {
        matchID: 1238931023890,
        stacks: [0, 2, 4, 6, 10, 14, 18, 8, 12, 14, 18, 22, 25]
    },
    {
        matchID: 1238931023890,
        stacks: [0, 2, 4, 6, 0, 4, 0, 2, 6, 0, 4, 0, 2]
    }
]


app.set('views', path.join(__dirname, '../frontend2'));
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    console.log('main page requested');

    res.render('../frontend2/index', {data: data});
})


app.listen(5000, () => {
    console.log('Server is running');
});