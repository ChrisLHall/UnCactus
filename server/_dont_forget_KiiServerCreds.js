// Change this filename to KiiServerCreds.js, but do not commit it

// TODO MODIFY THESE CREDENTIALS TO MATCH THE ADMIN KII USER
// In the Kii dashboard, you must manually add a user and ensure that user is the
// only one with write privileges in Planets and PlayerInfo

// Don't commit them to the repo, obviously
var KiiServerCreds = function () {
  var username = "admin_chall" // username here
  var password = "challosis12" // password here

  return {
    username: username,
    password: password
  }
}

module.exports = KiiServerCreds
