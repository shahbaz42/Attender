const express = require("express");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const g = require("./gapi");
const User = require("./model");


// Setup express
app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
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


//creating strategy for passport
passport.use(User.createStrategy());  

//Below code is for putting info into cookie
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

//Below code is for cracking open cookie to find info
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


// Route for displaying classes
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



// Route for sending create spreadsheet page
app.get("/create", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("create");
  } else {
    res.render("home");
  }
});



// Route for creating spreadsheet
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




app.get("/attendance", function (req, res) {
  if (req.isAuthenticated()) {
    g.readColumn(
      req.user.refresh_token,
      req.query.spreadsheetId,
      "Sheet1!A2:B",
      function (response) {
        res.render("attendance", { list: response.data.values });
      }
    );
  } else {
    res.render("home");
  }
});




app.put("/attendance", function(req, res){
  if(req.isAuthenticated()){
    
    g.insertColumn(req.user.refresh_token, req.query.spreadsheetId, function(r){
      g.addColumn(
        req.user.refresh_token,
        req.query.spreadsheetId, 
        "Sheet1!C:C", 
        req.body.data, 
        function(response){
          res.send("Done");
        });
    });

  }else{
    res.render("home");
  }
});




// Login Routes below
app.get("/login", function (req, res) {
  res.render("login");
});

// rouute for logging out
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

app.get("/demo/", function(req, res){
  res.send(req.query);
})


//Starting Server
app.listen(8000, function () {
  console.log("Server is running on port 8000");
});
