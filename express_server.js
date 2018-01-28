const fs = require('fs');
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY || 'dvelopment']
}));

const bcrypt = require('bcrypt');

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

// FUNCTIONS ----> (Names explain themselves)

function getUserData(userID) {
  return userDatabase[userID];
}

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

function findUserByEmail(email) {
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
  res.locals.userID = req.session.userID || false;
  next();
});

function getCurrentUser(req) {
  for (var key in userDatabase) {
    if (req.session['userID'] === key) {
      return key;
    }
  }
  return "";
}

//Function that will redirect you to the /login page if you are not logged in
const isUserLoggedIn = (req, res, next) => {
  if (req.session.userID) {
    next();
  } else {
    res.redirect("/login");
  }
};

//Function that will render a HTML error page if user is not logged in
const isUserLoggedInErrorPage = (req, res, next) => {
  if ( req.session.userID ) {
    next();
  } else {
    res.status(400);
    res.end("<html><body> You must be logged in to access this page! <a href='/login'>Login</a></html></body>");
  }
};

//renders registration page
app.get("/register", (req, res) => {

  res.render("urls_register", {userDatabase: userDatabase });

});

//saves submitted email and password to dataBase
//does not allow email and password to be left blank - or create duplicate emails
app.post('/register', (req, res) => {
  let submittedEmail = req.body.email;
  let password = req.body.password;
  let submittedPassword = bcrypt.hashSync(password, 10);

  if (!(submittedEmail && submittedPassword)) {
    res.status(400);
    res.end("<html><body>You must enter a valid email address and password to register. <a href='/register'>Register</a></body></html>");
  }
  if (findUserByEmail(submittedEmail)) {
    res.status(400);
    res.end("<html><body>The email you entered is already registered with an account. <a href='/login'>Login</a> or <a href='/register'>Register</a> </body></html>");
  } else {
    let userRandomID = generateRandomString();
    req.session.userID = userRandomID;
    userDatabase[userRandomID] = {
      "id": userRandomID,
      "email": submittedEmail,
      "password": submittedPassword
    };
  }
  res.redirect("/urls");
});

//renders login page - if you are logged in, redirects you to /urls
app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
    return;
  }
  res.render("login");
});

//signs users in through login page and checks for authentification
app.post("/login", (req, res) => {
  let user = findUserByEmail(req.body.email);
  if (!user) {
    res.status(403);
    res.end("<html><body> The information you submitted is WRONG! <a href='/register'>Register</a> or <a href='/login'>Login</a></body></html>");
    return;
  }
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403);
    res.end("<html><body> The information you submitted is WRONG! <a href='/register'>Register</a> or <a href='/login'>Login</a></body></html>");
    return;
  }
  req.session.userID = user.id;
  res.redirect("/urls");
});

//logs user out, clears cookie session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

//renders home page
app.get("/", (req, res) => {
  // if you're not logged in, redirects you to /login
  if (!req.session.userID) {
    res.redirect("/login");
    return;
  }
  // if you're logged in, redirects you to /urls
  res.redirect('/urls');
});


app.param('shortURL', (req, res, next, shortURL) => {
  const longURL = urlDatabase[shortURL];
  res.locals.shortURL = shortURL;
  res.locals.longURL = longURL;
  next();
});

//renders /urls only if you are logged in -- error message will occur if you are not logged in
app.get("/urls", isUserLoggedInErrorPage, (req, res) => {
  let templateVars = {
    urls: getUrlsForUser(req.session.userID),
    email: getUserData(req.session.userID)
  };
  res.render("urls_index", templateVars);
});

//renders /urls/new only if you are logged in -- page will redirect you to /login if you are not logged in
app.get("/urls/new", isUserLoggedIn, (req, res) => {
  let templateVars = {
    email: getUserData(req.session.userID)
  };
  res.render("urls_new", templateVars);
});

//creates short URL for long URL
app.post("/urls", isUserLoggedInErrorPage, (req, res) => {
  let userID = req.body.userID;
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  userID = req.session.userID;
  urlDatabase[shortURL] = { shortURL: shortURL, longURL: longURL, userID: userID };
  res.redirect(`/urls/${shortURL}`);
});

//renders an edit page if you'd like to update your longURL, access only if you are logged in
app.get("/urls/:shortURL", isUserLoggedInErrorPage, (req, res) => {
  const currentUser = getCurrentUser(req);
  //error message if shortURL has not been created or corresponding long URL is invalid
  if (!accessToShortURL(req.params.shortURL)) {
    res.end("<html><body> Short URL does not exist or corresponding long URL is invalid! </body></html>");
    return;
  }
  //error message if you try to access any short URLS that you have not created yourself
  if (!getUrlsForUser(req.session.userID)[req.params.shortURL] || currentUser !== getUrlsForUser(req.session.userID)[req.params.shortURL].userID) {
    res.end("<html><body> Sorry, this URL does not belong to you! <a href='/urls'>Head back to my URLS</a></body></html>");
    return;
  }
  let templateVars = {
    urls: getUrlsForUser(req.session.userID),
    email: getUserData(req.session.userID)
  };
  res.render("urls_show", templateVars);

});


//renders the longURL with whichever shortURL that was given, anyone can access this
app.get("/u/:shortURL", (req, res) => {
  if (!accessToShortURL(req.params.shortURL)) {
    //error message if shortURL does not exists or corresponding longURL is invalid
    res.end("<html><body> Short URL does not exist or corresponding long URL is invalid! </body></html>");
    return;
  }
  const longURL = accessToShortURL(req.params.shortURL);
  res.redirect(longURL);
});

//URL delete button, can only access if it is your own URL
app.post("/urls/:id/delete", isUserLoggedInErrorPage, (req, res) => {
  deleteUrlDatabase(req.params.id);
  res.redirect("/urls");
});

//edits longURL, redirects to /urls page, access only if you are logged in
app.post("/urls/:id", isUserLoggedInErrorPage, (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});












