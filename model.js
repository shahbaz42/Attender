const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();



// Connecting with Database
// const DB =
//   "mongodb+srv://" +
//   process.env.mongo_Username +
//   ":" +
//   process.env.mongo_Password +
//   "@cluster0.2lld6.mongodb.net/attendanceDB?retryWrites=true&w=majority";

const DB = "mongodb://localhost:27017/Attendance";



mongoose.connect(DB, function (err) {
  if (err) {
    console.log("No Connection");
    console.log(err);
  } else {
    console.log("Connection Sucessful");
  }
});



// Mongoose UserSchema
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  googleId: String,
  refresh_token: String,
  scope: [String],
  spreadsheets: [],
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

module.exports = User;