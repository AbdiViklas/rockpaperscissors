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

// initialize splashModal, with option to make it non-dismissible
  // TODO: why doesn't this work? modal is still dismissible
$('.modal').modal({
  dismissible: false
});

// open the sign-in modal--Materialize takes care of watching for DOM ready:
$('#splashModal').modal('open');

var initialModalContent = $("#splashModal").html();

// sign in with Google
$(document).on("click", "#google-auth", function (e) { 
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
$(document).on("click", "#existing-user", function (e) {
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
        <button class="btn waves-effect orange" type="submit" name="action">
          <i class="fa fa-gamepad" aria-hidden="true"></i>
          play 
        </button>
        <button class="btn back-btn waves-effect orange">
          <i class="fa fa-arrow-left" aria-hidden="true"></i>
          back
        </button>
      </form>
    </div>
  `);
});

$(document).on("click", ".back-btn", function () {
  $("#splashModal").html(initialModalContent);
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
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode === "auth/user-not-found") {
      Materialize.toast(`
        <h3>Who?</h3>
        <p>We don't recognize that combo of email and password.</p>
        <p>Want to create a <a class="waves-effect btn toast-btn orange" onclick="createNewUser()"><i class="fa fa-user-plus left" aria-hidden="true"></i>New user</a> ?</p>
        <p>Or just <a class="waves-effect btn toast-btn orange">try again</a> ?
      `);
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

// On click "new user",
$(document).on("click", "#create-user", function (e) {
  e.preventDefault();
  // form-building is separated into its own function so it can also get called by an unsuccessful attempt to log in as existing user
  createNewUser();
});

// display form to create new user
function createNewUser() {
  // build input form, id #create-new  
  $("#splashModal").html(`
    <div class="modal-content">
      <form id="create-new">
        <div class="row">
          <div class="input-field col s12">
            <input id="name" type="text" class="validate" required>
            <label for="name">Name</label>
          </div>
        </div>
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
        <!--icon picker-->
        <div class="row">
          <p>Pick a photo to represent you:</p>
          <div class="col s4 m2">
            <label>
              <input type="radio" name="icon" id="star" />
              <img class="responsive-img circle" src="assets/images/star.jpg">
            </label>
          </div>
          <div class="col s4 m2">
            <label>
              <input type="radio" name="icon" id="ball" />
              <img class="responsive-img circle" src="assets/images/ball.jpg">
            </label>
          </div>
          <div class="col s4 m2">
            <label>
              <input type="radio" name="icon" id="cat" />
              <img class="responsive-img circle" src="assets/images/cat.jpg">
            </label>
          </div>
          <div class="col s4 m2">
            <label>
              <input type="radio" name="icon" id="chess" />
              <img class="responsive-img circle" src="assets/images/chess.jpg">
            </label>
          </div>
          <div class="col s4 m2">
            <label>
              <input type="radio" name="icon" id="dog" />
              <img class="responsive-img circle" src="assets/images/dog.jpg">
            </label>
          </div>
          <div class="col s4 m2">
            <label>
              <input type="radio" name="icon" id="fish" />
              <img class="responsive-img circle" src="assets/images/fish.jpg">
            </label>
          </div>
        </div>
        <button class="btn waves-effect orange" type="submit" name="action">
          <i class="fa fa-gamepad" aria-hidden="true"></i>
          play
        </button>
        <button class="btn back-btn waves-effect orange">
          <i class="fa fa-arrow-left" aria-hidden="true"></i>
          back
        </button>
      </form>
    </div>
  `);

}

$(document).on("submit", "#create-new", function (e) {
  e.preventDefault();
  email = $("#email").val();
  password = $("#password").val();
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user){
    if (user) {
      console.log("logged in:", user);
    } else {
      console.log("no user");
    }

    // close the sign-in modal
    $("#splashModal").modal('close');
  }).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  var errorToastTxt = `
      <h3>I'm sorry, there's been a problem!</h3>
      <p>Error code "${errorCode}": ${errorMessage}.</p>
      <a class="btn waves-effect orange">OK</a>
    `;
    Materialize.toast(errorToastTxt);
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