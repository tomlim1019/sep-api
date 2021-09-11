require("dotenv").config();
const express =require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const api = require("./api");
 
const app = express();
 
const PORT= process.env.APP_PORT;
 
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api',api)
 
 
app.listen(PORT, ()=>{
    console.log(`server is listening  on ${PORT}`);
});
 
module.exports = app;