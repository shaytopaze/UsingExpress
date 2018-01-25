const fs = require('fs');
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
require('dotenv').config();
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function deleteUrlDatabase(shortURL) {
  delete urlDatabase[shortURL];
}

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function findUser_byEmail(email) {
  let foundUser = undefined;
  for (var userId in userDatabase) {
    if (userDatabase[userId].email === email) {
      foundUser = userDatabase[userId];
      break;
    }
  }
  return foundUser;
}

function findUserInUserDatabase(userInfo) {
  let foundUser = ""
  for (var user in userDatabase) {
   if (userDatabase[user]) {
      return true;
    } else {
      return false;
    }
}
}

app.use(function(req, res, next) {
  res.locals.userID = req.cookies.userID || false;    // Middleware
  next();
});

app.get("/register", (req, res) => {

  res.render("urls_register", {userDatabase: userDatabase, userID: req.cookies.userID});

});

app.post('/register', (req, res) => {
  let submittedEmail = req.body.email;
  let submittedPassword = req.body.password;

  if (!(submittedEmail && submittedPassword)) {
    res.statusCode = 400;
    res.end("You must enter a valid email address and password to register.")
  }
  if (findUser_byEmail(submittedEmail)) {
    res.statusCode = 400;
    res.end("The email you entered is already registered with an account.");
  } else {
    let userRandomID = generateRandomString();
    res.cookie('userID', userRandomID);
    userDatabase[userRandomID] = {
      "id": userRandomID,
      "email": submittedEmail,
      "password": submittedPassword
      }
    }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let user = findUser_byEmail(req.body.email);
  if (!user) {
    res.statusCode = 403;
    res.end("The email you entered has not been registered");
  } else if (user.password !== req.body.password)  {
    console.log(user.password);
    console.log(req.body.password);
    res.statusCode = 403;
    res.end("Incorrect Password");
  } else {
    res.cookie('userID', user.id);
    res.redirect("/");
  }
});


  // res.cookie('userID', req.body.userID);
  // res.redirect("/urls");


app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    userID: req.cookies.userID
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    userID: req.cookies.userID,
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };

  res.render("urls_show", templateVars);
  fs.appendFile('urlDatabase.txt', templateVars['shortURL'] + ' : ' + templateVars['longURL'] + '\n');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  deleteUrlDatabase(req.params.id);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});











