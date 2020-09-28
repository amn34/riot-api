const express = require('express');
const app = express();
const Mejai = require('./Mejai');
const path = require('path');

const mejai = new Mejai();

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../frontend2'));

app.get('/', (req, res) => {
    console.log('main page requested');
    // mejai.main()
    // .then(response => {
    //     res.send(response)
    // })
    // .catch(err => {
    //     console.log(err);
    // })
    res.render('../frontend2/index');
})


app.listen(5000, () => {
    console.log('Server is running');
});