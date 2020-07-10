require("./db");
const express = require("express");
const app = express();
const PORT = 3000;




app.listen(PORT,() => {console.log(`app listening on port ${PORT}`)})
