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
const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userId: "userRandomID"
  }
};

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "hey"
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
  let foundUser;
  for (var userId in userDatabase) {
    if (userDatabase[userId].email === email) {
      foundUser = userDatabase[userId];
      break;
    }
  }
  return foundUser;
}

function getUrlsForUser(userID) {
  let foundUrls = {};
  for (var shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      foundUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return foundUrls;
}

function accessToShortURL(short) {
  let foundUrls;
  for (var key in urlDatabase) {
    if (urlDatabase[key].shortURL === short) {
       foundUrls = urlDatabase[key].longURL;
    }
  }
  return foundUrls;
}

app.use(function(req, res, next) {
  res.locals.userID = req.cookies.userID || false;    // Middleware
  next();
});

const isUserLoggedIn = (req, res, next) => {
  if (req.cookies.userID) {
    next();
  } else {
    // alert("You need to register or login first!");
    res.redirect("/login")
  }
}

app.get("/register", (req, res) => {

  res.render("urls_register", {userDatabase: userDatabase });

});

app.post('/register', (req, res) => {
  let submittedEmail = req.body.email;
  let submittedPassword = req.body.password;

  if (!(submittedEmail && submittedPassword)) {
    res.statusCode = 400;
    res.end("<html><body>You must enter a valid email address and password to register. <a href='/register'>Register</a></body></html>");
  }
  if (findUser_byEmail(submittedEmail)) {
    res.statusCode = 400;
    res.end("<html><body>The email you entered is already registered with an account. <a href='/register'>Register</a></body></html>");
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
    res.end("<html><body>The email you entered has not been registered. <a href='/register'>Register</a></body></html>");
  } else if (user.password !== req.body.password)  {
    console.log(user.password);
    console.log(req.body.password);
    res.statusCode = 403;
    res.end("<html><body>Incorrect Password. <a href='/login'>Login</a></body></html>");
  } else {
    res.cookie('userID', user.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("/");
});

app.get("/", (req, res) => {
  // res.end("Hello!");
  res.redirect('/urls');
});

app.param('shortURL', (req, res, next, shortURL) => {
  const longURL = urlDatabase[shortURL];
  res.locals.shortURL = shortURL;
  res.locals.longURL = longURL;
  next();
});

app.get("/urls", isUserLoggedIn, (req, res) => {
  let templateVars = {
    urls: getUrlsForUser(req.cookies.userID),
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", isUserLoggedIn, (req, res) => {
  res.render("urls_new");
});

app.post("/urls", isUserLoggedIn, (req, res) => {
  var userID = req.body.userID;
  var shortURL = generateRandomString();
  var longURL = req.body.longURL;
  var userID = req.cookies.userID;
  urlDatabase[shortURL] = { shortURL: shortURL, longURL: longURL, userID: userID };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  res.render("urls_show", { urlDatabase: urlDatabase });

});

app.get("/u/:shortURL", (req, res) => {
  // const longURL = urlDatabase[req.params.shortURL];
  const longURL = accessToShortURL(req.params.shortURL);
  res.redirect(longURL);
});

app.post("/urls/:id/delete", isUserLoggedIn, (req, res) => {
  deleteUrlDatabase(req.params.id);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});











