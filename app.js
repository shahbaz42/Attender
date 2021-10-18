const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose"); //requiring mongoose
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
//const passportLocal = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const { google } = require("googleapis");

// Setup express
app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secret: process.env.sessions_Secret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize()); //initialising passport
app.use(passport.session()); //making express use passport.sessions

// Connecting with Database
const DB =
  "mongodb+srv://" +
  process.env.mongo_Username +
  ":" +
  process.env.mongo_Password +
  "@cluster0.2lld6.mongodb.net/attendanceDB?retryWrites=true&w=majority";

mongoose.connect(DB, function (err) {
  if (err) {
    console.log("No Connection");
    console.log(err);
  } else {
    console.log("Connection Sucessful");
  }
});

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  googleId: String,
  token: {
    refresh_token: String,
    access_token: String,
    scope: [String],
    expiry_date: Number,
  },
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

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
      console.log("AT : ", accessToken);
      console.log("RT : ", refreshToken);
      console.log("Params : ", params);
      User.findOrCreate(
        { googleId: profile.id, username: profile.id },
        {
          name: profile.displayName,
          token: {
            refresh_token: refreshToken,
            access_token: accessToken,
            scope: params.scope,
            expiry_date: params.expires_in,
          },
        },
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
    // console.log(req.user);
    res.render("classes", { name: req.user.name });
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
  res.render("a", { list: list });
});

///////////////////////////////////////////////////////////////////////////

const client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:8000/auth/google/secrets"
);

app.get("/create", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("create");
  } else {
    res.render("home");
  }
});

app.post("/create", function (req, res) {
  if (req.isAuthenticated()) {
    client.credentials = req.user.token;
    create(client, req.body.className);
    res.send("<h2>Created a class</h2>");
  } else {
    res.render("home");
  }
});

///////////////////////////////////////////////////////////////////////////

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

async function create(authClient, Name) {
  const sheets = google.sheets("v4");
  const request = {
    resource: {
      properties: {
        title: Name,
      },
    },

    auth: authClient,
  };

  try {
    const response = (await sheets.spreadsheets.create(request)).data;
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error(err);
  }
}
