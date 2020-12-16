const express = require('express');
const app = express();
const Mejai = require('./Mejai');
const path = require('path');
const {  performance } = require('perf_hooks');

const mejai = new Mejai();

app.set('views', path.join(__dirname, '../frontend2'));
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    console.log('main page requested');
    let t0 = performance.now();
    mejai.main()
    .then(response => {
        let t1 = performance.now();
        console.log("Time: ", t1 - t0);
        res.render('../frontend2/index', {data: response})
    })
    .catch(error => console.log(error.message))
})


app.listen(5000, () => {
    console.log('Server is running');
});