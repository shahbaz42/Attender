const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const g = require("./gapi");



// Setup express
app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");



// Configuring Express session
app.use(
  session({
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secret: process.env.sessions_Secret,
    resave: false,
    saveUninitialized: false,
  })
);



//initialising passport
app.use(passport.initialize());
//making express use passport.sessions
app.use(passport.session());



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



// Google strategy for passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, params, profile, cb) {
      User.findOneAndUpdate(
        { googleId: profile.id, username: profile.id },
        {
          name: profile.displayName,
          refresh_token: refreshToken,
          scope: params.scope,
        },
        { upsert: true },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);



passport.use(User.createStrategy());

//Below code is for putting info into cookie and for cracking open cookie to find info
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});



// Routes
app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/classes");
  } else {
    res.render("home");
  }
});


app.get("/classes", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function (err, found) {
      if (err) {
        console.log(err);
      } else {
        if (found) {
          res.render("classes", {
            name: found.name,
            spreadsheets: found.spreadsheets,
          });
        }
      }
    });
  } else {
    res.render("home");
  }
});


app.get("/attendance", function (req, res) {
  list = [
    { name: "Monkey", present: "False", rollNo: "1" },
    { name: "Dog", present: "False", rollNo: "2" },
    { name: "Cow", present: "False", rollNo: "3" },
    { name: "Raptor", present: "False", rollNo: "4" },
  ];
  res.render("attendance", { list: list });
});


app.get("/create", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("create");
  } else {
    res.render("home");
  }
});


app.post("/create", function (req, res) {
  if (req.isAuthenticated()) {
    g.createSpreadsheet(
      req.user.refresh_token,
      req.body.className,
      function (response) {
        User.findById(req.user.id, function (err, found) {
          if (err) {
            console.log(err);
          } else {
            if (found) {
              found.spreadsheets.push({
                name: req.body.className,
                spreadsheetId: response.data.spreadsheetId,
                spreadsheetUrl: response.data.spreadsheetUrl,
              });
              found.save(function () {
                res.redirect("/classes");
              });
            }
          }
        });
      }
    );
  } else {
    res.render("home");
  }
});


app.get("/attendance/:spreadsheetId", function (req, res) {
  if (req.isAuthenticated()) {
    g.readColumn(
      req.user.refresh_token,
      req.params.spreadsheetId,
      "Sheet1!A1:A",
      function (response) {
        res.send(response);
      }
    );
  } else {
    res.render("home");
  }
});


// Login Routes below
app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/drive.file"],
    accessType: "offline",
    approvalPrompt: "force",
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

app.listen(8000, function () {
  console.log("Server is running on port 8000");
});
