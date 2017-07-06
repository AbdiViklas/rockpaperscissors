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

var displayName, email, password, photoURL, playerNum, choice;

var signedIn = false;

// To hold user's display information
var currentUser = {
  displayName: "",
  photoURL: ""
}

// USER AUTH

// initialize splashModal, with option to make it non-dismissible
  // TODO: why doesn't this work? modal is still dismissible
$('.modal').modal({
  dismissible: false
});

var initialModalContent = $("#splashModal").html();

// success and error handlers for after sign in
function logInOut() {
  var user = firebase.auth().currentUser;
    console.log("logInOut received:", user); // the object logged here has displayName set correctly
  if (user) {
    // User is signed in
    $("#splashModal").modal('close');
    currentUser.displayName = user.displayName;
    // BUG: the two lines below log null on first time createUser
    console.log("user.displayName:", user.displayName);
    console.log("currentUser.displayName", currentUser.displayName);
    currentUser.email = user.email;
    currentUser.photoURL = user.photoURL;
    // var emailVerified = user.emailVerified;
    // var isAnonymous = user.isAnonymous; //?
    // var uid = user.uid;
    // var providerData = user.providerData;
    $("#messages").empty();
    glowOrange($("#messages"), `<img src="${currentUser.photoURL}" class="user-pic img-responsive circle">Welcome ${currentUser.displayName}!`);
    // update firebase with the order in which players have arrived
    database.ref("players").once("value").then(function(snapshot){
      var players = snapshot.val();
      // If you're the first one here...
      if (players.player1 === "") {
        database.ref("players/player1").set(currentUser.displayName);
        playerNum = "player1";
        signedIn = true;
        // a little timeout just for the appearance of it
        setTimeout(function() {
          glowOrange($("#messages"), "Now waiting for Player 2...");
        }, 1000);
      } else if (players.player2 === "") { // if you're the second one here...
        database.ref("players/player2").set(currentUser.displayName);
        playerNum = "player2";
        signedIn = true;
        // a little timeout just for the appearance of it
        setTimeout(function() {
          glowOrange($("#messages"), players.player1 + " is already waiting for you!");
        }, 1000);
      } else {
        glowOrange($("#messages"), `Sorry, ${players.player1} is playing ${players.player2} right now. Wait for one of them to sign out.`)
      }
    });
    // TODO: fix the fact that if one player reloads the page they are now playing themself
  } else if (!user) {
    // User is signed out.
    console.log("no user");
    $("#messages").empty();
    $("#splashModal").html(initialModalContent);
    $('#splashModal').modal('open');
  }
}

database.ref("players").on("child_changed", function(snapshot){
  var change = snapshot.val();
  console.log(change);
  if (playerNum === undefined) {
    return; 
    // Meaning this is the initial call of this function, on page load, before playerNum has had a chance to be set
  } else if (signedIn && change === "") {
    // Meaning "I'm signed in, but the other player isn't"
    glowOrange($("#messages"), "Oops, the other player has signed out. Um, you win by default, I guess?");
  } else if (change !== currentUser.displayName) {
    glowOrange($("#messages"), change + " has arrived!");
  }
});

function handleAuthError(error) {
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
}

// sign in with Google
$(document).on("click", "#google-auth", function (e) { 
  e.preventDefault();
  var provider = new firebase.auth.GoogleAuthProvider();
  // send the user off on a redirect to Google sign in
  firebase.auth().signInWithRedirect(provider);
  // handle what happens when they get back
  firebase.auth().getRedirectResult()
  // .then(logInOut)
  .catch(handleAuthError);
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
  firebase.auth().signInWithEmailAndPassword(email, password)
  .catch(handleAuthError);
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

// sign in as new user
$(document).on("submit", "#create-new", function (e) {
  e.preventDefault();
  email = $("#email").val().trim();
  password = $("#password").val().trim();
  displayName = $("#name").val().trim();
  photoURL = "assets/images/" + $("input[name=icon]:checked").attr("id") + ".jpg";
  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then(function(user){
    console.log("new user:", user);
    console.log("firebase.auth().currentUser", firebase.auth().currentUser);
    firebase.auth().currentUser.updateProfile({
      displayName: displayName,
      photoURL: photoURL
    });
    console.log("current user after", firebase.auth().currentUser);
    // TODO: remove this alert when the problem is solved
    alert("Due to a bug I haven't solved, your name and picture will display as null. Refresh the page and they will work.");
  })
  .catch(handleAuthError);
});


firebase.auth().onAuthStateChanged(logInOut);


$(document).on("click", "#sign-out", function (e) {
  e.preventDefault();
  // first, negate signedIn so the child_added listener on the database "players" node can distinguish between this signout and the initial absence of users
  signedIn = false;
  // return firebase player designation to empty string (you can't have a key with no value) and local var playerNum to undefined
  database.ref("players/" + playerNum).set("").then(function(){
    playerNum = undefined;
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
    }).catch(function(error) {
      // An error happened.
      console.log(error);
    });
  });
});

// UI BEHAVIOR

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

function glowOrange(target, string) {
  console.log(string);
  var newDiv = $("<p class='glow-orange flow-text'>");
  newDiv.html(string);
  target.append(newDiv);
  target.scrollTop(target.height()); // scroll to bottom
  // use CSS transitions to bring an orange text-shadow in and out
  setTimeout(function() {
    newDiv.addClass("glowing");
  }, 25);
  setTimeout(function() {
    newDiv.removeClass("glowing");
  }, 3000);
}

// GAMEPLAY

// TODO: handle player turn order, prompt players

// select only one RPS button at a time (like radio buttons)
$(".hand-box").click(function (e) { 
  e.preventDefault();
  $(".hand-box").not($(this)).removeClass("choice");
  $(this).addClass("choice");
});