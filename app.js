const express = require('express');
const ejs = require('ejs');
const bodyParser = require("body-parser");
const https = require("https");
require("dotenv").config() ;  

app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true})); 
app.set("view engine", "ejs");

app.get("/", function(req, res){
    res.render("home");
})

app.post("/", function(req, res){
    res.send("Hey "+req.body.name + "! Your attendance has been marked!")
    const url = process.env.URL + "?p1="+req.body.name+"&p2=Present"
    https.get(url, function(){
        console.log("Sent Request");
    })
})

app.get("/qr", function(req, res){
    res.send("QR working");
})

app.listen(8000, function(){
    console.log("Server is running on port 8000");
  });