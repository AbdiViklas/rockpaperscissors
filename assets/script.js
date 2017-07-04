// specify globals for the benefit of ESLint
/* global $, firebase */

// Initialize Firebase
var config = {
  apiKey: "AIzaSyAHoO8GAcHnwCdbuPxfY-w1peDZl744qcA",
  authDomain: "rockpaperscissors-fbf7f.firebaseapp.com",
  databaseURL: "https://rockpaperscissors-fbf7f.firebaseio.com",
  projectId: "rockpaperscissors-fbf7f",
  storageBucket: "",
  messagingSenderId: "683009294904"
};
firebase.initializeApp(config);

var database = firebase.database();

// To hold user's auth information
var email = "";
var password = "";

// firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
//   // Handle Errors here.
//   var errorCode = error.code;
//   var errorMessage = error.message;
//   // ...
// });

// firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
//   // Handle Errors here.
//   var errorCode = error.code;
//   var errorMessage = error.message;
//   // ...
// });

var sampleUser = {
  userName: "foo",
  choice: "",
  totalWins: 0,
  totalLosses: 0
}

// How to handle chat history:
// Make it a property of the user object?
// Or its own (top-level) object, maybe an array (for ordering) full of objects, each with only one key-value pair ({userName: "message"})?
// the latter.

// What happens on logout? Chat history persists for still-connected user. If a new player2 comes along, though, they shouldn't see history.
// and maybe at that point it's reset for player1 as well?
// on "new game" between both existing players, though, chat should persist

$("#signIn").submit(function (e) { 
  e.preventDefault();
  email = $("#email").val();
  password = $("#password").val();
  firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log("Error", errorCode, ":", errorMessage);
    if (errorCode === "auth/user-not-found") {
      firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("Error", errorCode, ":", errorMessage);
        // ...
      });
    }
    // ...
  });
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("user:", user);
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    // ...
  } else {
    // User is signed out.
    // ...
  }
});