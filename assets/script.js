// specify globals for the benefit of ESLint
/* global $, firebase, Materialize */

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
var displayName = "";
var email = "";
var password = "";
var photoURL = "";
// increment to 1 or 2 on player connect
var playersPresent = 0;

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

// TODO: delete. just here to help me visualize the needed properties
var sampleUser = {
  displayName: "foo",
  photoURL: "",
  conected: false, //?
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

// USER AUTH

// open the sign-in modal--Materialize takes care of watching for DOM ready:
$('#splashModal').modal('open');

// sign in with Google
$("#google-auth").click(function (e) { 
  e.preventDefault();
  var provider = new firebase.auth.GoogleAuthProvider();
  // send the user off on a redirect to Google sign in
  firebase.auth().signInWithRedirect(provider);
  // handle what happens when they get back
  firebase.auth().getRedirectResult().then(function(result) {
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // ...
    }
    // close the sign-in modal
    $("#splashModal").modal('close');
    // The signed-in user info.
    var user = result.user;
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    var errorToastTxt = `
      <h3>I'm sorry, there's been a problem!</h3>
      <p>Error code "${errorCode}," when logging in with ${email} via ${credential}: ${errorMessage}.</p>
      <a class="btn waves-effect orange">OK</a>
    `;
    Materialize.toast(errorToastTxt);
  });
});

// display form to sign in as existing user
$("#existing-user").click(function (e) {
  e.preventDefault();
  $("#splashModal").html(`
    <div class="modal-content">
      <form id="signIn">
        <div class="row">
          <div class="input-field col s12">
            <input id="email" type="email" class="validate" required>
            <label for="email">Email</label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12">
            <input id="password" type="password" class="validate" autocomplete="current-password" minlength="6" maxlength="12" required>
            <label for="password">Password</label>
          </div>
        </div>
        <button class="btn waves-effect orange" type="submit" name="action">play
          <i class="fa fa-gamepad" aria-hidden="true"></i>
        </button>
      </form>
    </div>
  `);
});

// sign in with existing email/password
$(document).on("submit", "#signIn", function (e) {
  e.preventDefault();
  console.log("submitted");
  email = $("#email").val();
  password = $("#password").val();
  // TODO: create success promise
  firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    console.log("error");
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode === "auth/user-not-found") {
      createNewUser();
    } else {
    var errorToastTxt = `
      <h3>I'm sorry, there's been a problem!</h3>
      <p>Error code "${errorCode}": ${errorMessage}.</p>
      <a class="btn waves-effect orange">OK</a>
    `;
    Materialize.toast(errorToastTxt);
    }
  });
});

// display form to create new user
$("#create-user").click(function (e) { 
  e.preventDefault();
  createNewUser();
});

// create new user
function createNewUser() {
  // build input form, id #create-new  
  $("#splashModal").html(`
    <div class="modal-content">
      <form id="create-new">
        <div class="row">
          <div class="input-field col s12">
            <input id="email" type="email" class="validate" required>
            <label for="email">Email</label>
          </div>
        </div>
        <div class="row">
          <div class="input-field col s12">
            <input id="password" type="password" class="validate" autocomplete="current-password" minlength="6" maxlength="12" required>
            <label for="password">Password</label>
          </div>
        </div>
        <button class="btn waves-effect orange" type="submit" name="action">play
          <i class="fa fa-gamepad" aria-hidden="true"></i>
        </button>
      </form>
    </div>
  `);
  // firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  //   // Handle Errors here.
  //   var errorCode = error.code;
  //   var errorMessage = error.message;
  //   console.log("Error", errorCode, ":", errorMessage);
  //   // ...
  // });
}

$(document).on("submit", "#create-new", function (e) {
  e.preventDefault();
  
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log("user:", user);
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous; //?
    var uid = user.uid;
    var providerData = user.providerData;
    // ...
  } else {
    // User is signed out.
    // ...
  }
});

// Make Materialize toasts dismissible with click
$(document).on("click", ".toast", function () {
  $(this).fadeOut(function(){
    $(this).remove();
  });
});

// A little check that the Google button isn't overflowing and truncating
$(document).ready(function(){
  // TODO: delete testing toast
  // Materialize.toast(`<p>test</p><a class="btn orange waves-effect">OK</a>`);
  var googleAuth = document.getElementById("google-auth");
  if (googleAuth.scrollHeight > googleAuth.clientHeight) {
    googleAuth.style.padding = "0 1rem";
  }
});