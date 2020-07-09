require("./db");
const express = require("express");
const app = express();
const result = require("./restaurant-data");

const PORT = 3000;

app.get("/",(req,res) =>{
    res.send(result);
})



app.listen(PORT,() => {console.log(`app listening on port ${PORT}`)})
