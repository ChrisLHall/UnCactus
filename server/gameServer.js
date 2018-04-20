var util = require('util')
var path = require('path')
express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http, {origins:'localhost:* 192.168.*.*:* http://chrislhall.net:* http://www.chrislhall.net:* http://chrislhall.net/bees http://www.chrislhall.net/bees'})
var uuidv4 = require('uuid/v4')

var Player = require('../Common/Player')
var Planet = require('../Common/Planet')
var Cactus = require('../Common/Cactus')
var CommonUtil = require('../Common/CommonUtil')
var kii = require('kii-cloud-sdk').create()
var KiiServerCreds = require('./KiiServerCreds')()
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var port = process.env.PORT || 4545

var players	// Array of connected players
var planets // Array of planets
var currentPlanetIdx = 0 // checking for modified planets

/* ************************************************
** GAME INITIALISATION
************************************************ */

app.use(express.static(path.resolve(__dirname, '../build')))
http.listen(port, function (err) {
  if (err) {
    throw err
  }

  initializeKii()
})

rl.on('line', (input) => {
  console.log("Command input: " + input);
  if (input === "quit") {
    process.exit(0)
  } else if (input === "kill all plants") {
    DEBUGKillAllPlants()
  } else if (input === "replant") {
    DEBUGReplant()
  }
});

function initializeKii () {
  if ("" === KiiServerCreds.username || "" === KiiServerCreds.password) {
    console.log("Remember to populate server credentials in KiiServerCreds.js. Exiting...")
    process.exit(1)
    return //?
  }
  kii.Kii.initializeWithSite("l1rxzy4xclvo", "f662ebb1125548bc84626f5264eb11b4", kii.KiiSite.US);
  kii.KiiUser.authenticate(KiiServerCreds.username, KiiServerCreds.password).then(function (user) {
    console.log("Kii Admin User authenticated.")
    fetchMetadata() // Start everything here
  }).catch(function (error) {
    var errorString = error.message;
    console.log("FAILED Kii Admin authentication: " + errorString);
    process.exit(1)
    return //?
  });
}

function fetchMetadata () {
  metadata = null
  metadataKiiObj = null

  var queryObject = kii.KiiQuery.queryWithClause(null);

  var bucket = kii.Kii.bucketWithName("Metadata");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    if (result.length > 0) {
      if (result.length > 1) {
        console.log("Multiple server metadata objects")
      }
      metadataKiiObj = result[0]
      metadata = metadataKiiObj._customInfo
      // Start the game here!
      init()
    } else {
      console.log("Failed to find metadata, exiting")
      process.exit(1)
      return
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log("Failed to find metadata, exiting. Error: " + errorString)
    process.exit(1)
    return
  });
}

function writeMetadata () {
  for (var key in metadata) {
    if (metadata.hasOwnProperty(key)) {
        metadataKiiObj.set(key, metadata[key])
    }
  }
  metadataKiiObj.save().catch(function (error) {
    var errorString = "" + error.code + ": " + error.message
    console.log("ERROR: Unable to save metadata. Info: " + errorString);
  });
}

function init () {
  players = []
  planets = []

  queryAllPlanets()

  // Start listening for events
  setEventHandlers()
  setInterval(tick, 10000)
}

function tick() {
  metadata["serverticks"] += 1;
  io.emit('server tick', {serverTicks: metadata["serverticks"]})
  writeMetadata()

  growPlants()
}

// Process the map
function growPlants () {
  for (var planetIdx = 0; planetIdx < planets.length; planetIdx++){
    var planet = planets[planetIdx]
    var planetSlots = planet.info.slots
    var changed = false
    for (var slotIdx = 0; slotIdx < 6; slotIdx++) {
      var slot = planetSlots[slotIdx]
      var age = metadata["serverticks"] - slot.birthTick
      if (slot.type === "empty" && age > 20 && Math.random() < .05) {
        slot.type = "cactus1"
        slot.birthTick = metadata["serverticks"]
        changed = true
      } else if (slot.type.startsWith("cactus") && age > 50 && Math.random() < .05) {
        slot.type = "empty"
        slot.birthTick = metadata["serverticks"]
        changed = true
      }
    }
    if (changed) {
      setPlanetInfo(planet.kiiObj, planet, planet.planetID, planet.info)
    }
  }
}

// todo remove
function DEBUGKillAllPlants () {
  for (var planetIdx = 0; planetIdx < planets.length; planetIdx++){
    var planet = planets[planetIdx]
    var planetSlots = planet.info.slots
    for (var slotIdx = 0; slotIdx < 6; slotIdx++) {
      planetSlots[slotIdx].type = "empty"
      planetSlots[slotIdx].birthTick = metadata["serverticks"]
    }
    setPlanetInfo(planet.kiiObj, planet, planet.planetID, planet.info)
  }
}
function DEBUGReplant () {
  for (var planetIdx = 0; planetIdx < planets.length; planetIdx++){
    var planet = planets[planetIdx]
    var planetSlots = planet.info.slots
    for (var slotIdx = 0; slotIdx < 6; slotIdx++) {
      planetSlots[slotIdx].type = "cactus1"
      planetSlots[slotIdx].birthTick = metadata["serverticks"]
    }
    setPlanetInfo(planet.kiiObj, planet, planet.planetID, planet.info)
  }
}

/* ************************************************
** GAME EVENT HANDLERS
************************************************ */
function setEventHandlers () {
  // Socket.IO
  io.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
  console.log('New player has connected: ' + client.id)

  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect)

  // Listen for new player message
  client.on('new player', onNewPlayer)

  // Listen for move player message
  client.on('move player', onMovePlayer)

  client.on('shout', onShout)
  // TEMP chat
  client.on('chat message', onReceiveChat)
}

// Socket client has disconnected
function onClientDisconnect () {
  var removePlayer = playerBySocket(this)

  // Player not found
  if (null == removePlayer) {
    console.log('Player not found for connection: ' + this.id)
    return
  }

  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)

  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {playerID: removePlayer.playerID})
}

// New player has joined
function onNewPlayer (data) {
  var newPlayerID
  if (data.preferredID == null) {
    newPlayerID = this.id // get player ID from original connection ID
  } else {
    newPlayerID = data.preferredID
  }
  console.log("playerID of new player: " + newPlayerID)
  // Create a new player
  var newPlayer = new Player(data.x, data.y, newPlayerID, this)
  getOrInitPlayerInfo(newPlayer, newPlayer.playerID)

  this.emit('confirm id', {playerID: newPlayer.playerID})
  // Broadcast new player to other connected socket clients
  this.broadcast.emit('new player', {playerID: newPlayer.playerID, x: newPlayer.getX(), y: newPlayer.getY()})

  // Send existing players to the new player
  var i, existingPlayer
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    if (existingPlayer.playerID == newPlayer.playerID) {
      // boot duplicate player
      existingPlayer.socket.disconnect()
      players.splice(i, 1)
      i--
    } else {
      this.emit('new player', {playerID: existingPlayer.playerID, x: existingPlayer.getX(), y: existingPlayer.getY()})
    }
  }

  // Add new player to the players array after duplicates have been removed
  players.push(newPlayer)
}

// Player has moved
function onMovePlayer (data) {
  var movePlayer = playerBySocket(this)

  // Player not found
  if (null == movePlayer) {
    console.log('Player not found for connection: ' + this.id)
    return
  }

  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)
  movePlayer.setAngle(data.angle)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {playerID: movePlayer.playerID, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle()})
}

function onShout (data) {
  io.emit("shout", data) // data just has player id

}

function onReceiveChat (msg) {
  var text = "" + this.id + ": " + msg
  console.log(text)
  io.emit("chat message", text)
}

function inStartTiles (x, y) {
  loc = x.toString() + ',' + y.toString()
  if (startTiles[loc]) {
    return true
  } else {
    return false
  }
}

function createHomePlanet(playerID) {
  var planet = new Planet(uuidv4())
  var planetInfo = Planet.generateNewInfo(planet.planetID, -1800 + Math.random() * 3600, -1800 + Math.random() * 3600, playerID)
  planet.info = planetInfo
  return planet
}

function createEmptyPlanet() {
  var planet = new Planet(uuidv4())
  var planetInfo = Planet.generateNewInfo(planet.planetID, -1800 + Math.random() * 3600, -1800 + Math.random() * 3600, "")
  planet.info = planetInfo
  return planet
}

function getOrInitPlayerInfo(player, playerID) {
  var queryObject = kii.KiiQuery.queryWithClause(kii.KiiClause.equals("playerid", playerID));
  queryObject.sortByDesc("_created");

  var bucket = kii.Kii.bucketWithName("PlayerInfo");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    if (result.length > 0) {
      if (result.length > 1) {
        console.log("Multiple PlayerInfos for " + playerID)
      }
      console.log(playerID + ": PlayerInfo query successful")
      player.kiiObj = result[0]
      var info = result[0]._customInfo
      CommonUtil.validate(info, Player.generateNewInfo(playerID))
      player.info = info
    } else {
      console.log(playerID + ": PlayerInfo query failed, returned no objects")
      setPlayerInfo(null, player, playerID, Player.generateNewInfo(playerID))
      // create home planet
      var homePlanet = createHomePlanet(playerID)
      planets.push(homePlanet)
      setPlanetInfo(null, homePlanet, homePlanet.planetID, homePlanet.info)
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log(playerID + ": PlayerInfo query failed, unable to execute query: " + errorString);
  });
}

function setPlayerInfo(existingKiiObj, player, playerID, playerInfo) {
  var obj = existingKiiObj
  if (null == obj) {
    var bucket = kii.Kii.bucketWithName("PlayerInfo");
    obj = bucket.createObject();
  }
  for (var key in playerInfo) {
    if (playerInfo.hasOwnProperty(key)) {
      obj.set(key, playerInfo[key]);
    }
  }

  obj.save().then(function (obj) {
    player.kiiObj = obj
    player.info = obj._customInfo
    console.log(playerID + ": player info save succeeded");
    player.socket.emit('update player info', {playerID: playerID})
  }).catch(function (error) {
    var errorString = "" + error.code + ": " + error.message
    console.log(playerID + ": Unable to create player info: " + errorString);
  });
}

function queryAllPlanets() {
  planets = []
  var queryObject = kii.KiiQuery.queryWithClause(null);
  queryObject.sortByDesc("_created");

  var bucket = kii.Kii.bucketWithName("Planets");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    console.log("Successfully queried number of planets: " + result.length)
    for (var i = 0; i < result.length; i++) {
      var planetResult = result[i]
      var planetInfo = planetResult._customInfo
      var planet = new Planet(planetInfo.planetid)
      planet.kiiObj = planetResult
      CommonUtil.validate(planetInfo, Planet.generateNewInfo(planetInfo.planetid, 0, 0, ""))
      planet.info = planetInfo
      planets.push(planet)
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log("All Planets query failed, unable to execute query: " + errorString);
  });
}

function getPlanetInfo(planet, planetID) {
  var queryObject = kii.KiiQuery.queryWithClause(kii.KiiClause.equals("planetid", planetID));
  queryObject.sortByDesc("_created");

  var bucket = kii.Kii.bucketWithName("Planets");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    if (result.length > 0) {
      if (result.length > 1) {
        console.log("Multiple Planets for " + planetID)
      }
      console.log(planetID + ": Planet query successful")
      planet.kiiObj = result[0]
      var planetInfo = result[0]._customInfo
      CommonUtil.validate(planetInfo, Planet.generateNewInfo(planetID, 0, 0, ""))
      planet.info = planetInfo
    } else {
      console.log(planetID + ": Planet query failed, returned no objects")
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log(planetID + ": Planet query failed, unable to execute query: " + errorString);
  });
}

function setPlanetInfo(existingKiiObj, planet, planetID, planetInfo) {
  var obj = existingKiiObj
  if (null == obj) {
    var bucket = kii.Kii.bucketWithName("Planets");
    obj = bucket.createObject();
  }
  for (var key in planetInfo) {
    if (planetInfo.hasOwnProperty(key)) {
      obj.set(key, planetInfo[key]);
    }
  }

  obj.save().then(function (obj) {
    planet.kiiObj = obj
    planet.info = obj._customInfo
    console.log(planetID + ": planet info save succeeded");
    io.emit('update planet info', {planetID: planetID})
  }).catch(function (error) {
    var errorString = "" + error.code + ": " + error.message
    console.log(playerID + ": Unable to create planet info: " + errorString);
  });
}

/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID....maybe no need?
function playerByID (playerID) {
  var i
  for (i = 0; i < players.length; i++) {
    if (players[i].playerID === playerID) {
      return players[i]
    }
  }
  return null
}

function playerBySocket (socket) {
  var i
  for (i = 0; i < players.length; i++) {
    if (players[i].socket === socket) {
      return players[i]
    }
  }
  return null
}
