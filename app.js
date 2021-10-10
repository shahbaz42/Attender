const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const https = require("https");
require("dotenv").config();
const mongoose = require("mongoose"); //requiring mongoose

app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const DB = "mongodb+srv://"+process.env.mongo_Username+":"+process.env.mongo_Password+"@cluster0.2lld6.mongodb.net/attendanceDB?retryWrites=true&w=majority";

mongoose.connect(DB).then(()=> {
  console.log("Connection Sucessful");
}).catch((err)=>console.log("No Connection"));

list = [
  { name: "Monkey", present: "False", rollNo: "1" },
  { name: "Dog", present: "False", rollNo: "2" },
  { name: "Cow", present: "False", rollNo: "3" },
  { name: "Raptor", present: "False", rollNo: "4" },
];

const itemsSchema = {    // schema for items
  name : String
};

const Item  =  mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name : "Welcome to your to do list"
})

item1.save();

app.get("/", function (req, res) {
  res.render("home");
});

app.post("/", function (req, res) {
  res.send("Hey " + req.body.name + "! Your attendance has been marked!");
  const url = process.env.URL + "?p1=" + req.body.name + "&p2=Present";
  https.get(url, function () {
    console.log("Sent Request");
  });
});

app.get("/a", function (req, res) {
  res.render("a", { list: list });
});

app.listen(8000, function () {
  console.log("Server is running on port 8000");
});
