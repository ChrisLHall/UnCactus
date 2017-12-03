var util = require('util')
var path = require('path')
express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http, {origins:'localhost:* 192.168.*.*:* http://chrislhall.net:* http://www.chrislhall.net:* http://chrislhall.net/bees http://www.chrislhall.net/bees'})

var ServerPlayer = require('./ServerPlayer')
var Interactions = require('./Interactions')

var port = process.env.PORT || 4444

/* ************************************************
** GAME VARIABLES
************************************************ */
var socket	// Socket controller
var players	// Array of connected players

/* ************************************************
** GAME INITIALISATION
************************************************ */

app.use(express.static(path.resolve(__dirname, '../build')))
http.listen(port, function (err) {
  if (err) {
    throw err
  }

  init()
})

var startTiles = {
    '-2,-2': 13,
    '-1,-2': 13,
    '0,-2': 13,
    '1,-2': 13,
    '2,-2': 13,
    '-2,-1': 13,
    '0,-1': 6,
    '2,-1': 13,
    '-2,0': 13,
    '2,0': 13,
    '-2,1': 13,
    '-1,1': 13,
    '0,1': 5,
    '1,1': 13,
    '2,1': 13,
    '0,2': 4,
    '1,2': 1,
    '1,3': 1,
    '1,4': 3,
    '0,4': 3,
    '-1,5': 9,
    '0,5': 9,
    '-1,6': 4,
    '0,6': 4,
    '1,6': 4,
    '1,7': 8,
    '2,7': 8,
    '1,8': 1,
    '2,8': 1,
    '1,9': 4,
    '2,9': 4,
    '3,9': 2,
    '3,8': 2,
    '3,7': 2,
    '3,6': 7,
}
var tiles = {}
var items = {}
var money = 0

function init () {
  // Create an empty array to store players
  players = []

  for (var loc in startTiles) {
    tiles[loc] = startTiles[loc]
  }

  // Start listening for events
  setEventHandlers()
  setInterval(updateMap, 300)
}

var SPAWN_PROB = 0.1
var GRIND_PROB = 1
var PACK_PROB = 0.3
var COOK_PROB = 0.5
var DIE_PROB = 0.01
var MAX_PER_EMITTER = 10
// Process the map
function updateMap () {
  
}

function countNumWithId (objectsDict, id) {
  var count = 0
  for (var key in objectsDict) {
    if (objectsDict[key] === id) {
      count++
    }
  }
  return count
}

/* ************************************************
** GAME EVENT HANDLERS
************************************************ */
var setEventHandlers = function () {
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

  client.on('change tile', onChangeTile)

  client.on('query map', onQueryMap)

  client.on('query tile cost', onQueryTileCost)

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
  var newPlayer = new ServerPlayer(data.x, data.y, newPlayerID, this)

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
  movePlayer.setVX(data.vx)
  movePlayer.setVY(data.vy)
  movePlayer.setAngle(data.angle)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {playerID: movePlayer.playerID, x: movePlayer.getX(), y: movePlayer.getY(), vx: movePlayer.getVX(), vy: movePlayer.getVY(), angle: movePlayer.getAngle()})
}

function onQueryMap (data) {
  this.emit('update map', {items: items, tiles: tiles, money: money})
}

function onQueryTileCost (data) {
  var cost = (data.tileId === 0) ? 0 : Interactions.tileDefs[data.tileId].cost
  this.emit('update tile cost', {tileId: data.tileId, cost: cost})
}

function onChangeTile (data) {
  // data.x, data.y, data.tileId
  var coord = data.x.toString() + ',' + data.y.toString()
  if (data.tileId === 0 && items[coord]) {
    newItems = {}
    for (var loc in items) {
      if (loc !== coord) {
        newItems[loc] = items[loc]
      }
    }
    items = newItems
  } else if (data.tileId === 0 && tiles[coord]) {
    if (!inStartTiles(data.x, data.y)) { // protected zone
      // delete this tile
      newTiles = {}
      for (var loc in tiles) {
        if (loc !== coord) {
          newTiles[loc] = tiles[loc]
        }
      }
      tiles = newTiles
    }
  } else if (data.tileId !== 0) {
    if (!inStartTiles(data.x, data.y)) { // protected zone
      var cost = Interactions.tileDefs[data.tileId].cost
      if (money >= cost) {
        tiles[coord] = data.tileId
        money -= cost
      }
    }
  }

  this.broadcast.emit('update map', {items: items, tiles: tiles, money: money})
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

/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID....maybe no need?
function playerByPlayerID (playerID) {
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
