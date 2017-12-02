var util = require('util')
var path = require('path')
express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http, {origins:'localhost:* 192.168.*.*:* http://chrislhall.net:* http://www.chrislhall.net:* http://chrislhall.net/bees http://www.chrislhall.net/bees'})

var Player = require('./Player')
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
  var newItems = {}
  for (var loc in tiles) {
    var type = tiles[loc]
    var bits = loc.split(',')
    var x = parseInt(bits[0])
    var y = parseInt(bits[1])

    if (Interactions.tileDefs[type].spawns && Math.random() < SPAWN_PROB
        && countNumWithId(items, Interactions.tileDefs[type].spawns) < MAX_PER_EMITTER * countNumWithId(tiles, type)) {
      if (!(items[loc]) && !(newItems[loc])) {
        newItems[loc] = Interactions.tileDefs[type].spawns
      }
    }
  }
  for (var loc in items) {
    var setNewItem = false
    var type = items[loc]
    var bits = loc.split(',')
    var x = parseInt(bits[0])
    var y = parseInt(bits[1])
    var tileType = tiles[loc]
    var downLoc = x.toString() + ',' + (y + 1).toString()
    var downTileType = tiles[downLoc]

    if (Interactions.itemDefs[type].type === 'creature') { // && Math.random() < 0.2) {
      if (Math.random() < DIE_PROB) {
        setNewItem = true
      }
      if (!setNewItem && tileType && Interactions.tileDefs[tileType].action == 'grinds'
          && Math.random() < GRIND_PROB) {
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = Interactions.itemDefs[type].grinds
          setNewItem = true
        }
      }
      // suck into grinder
      if (!setNewItem && downTileType && Interactions.tileDefs[downTileType].action == 'grinds') {
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = type
          setNewItem = true
        }
      }
      if (!setNewItem) {
        var deltas = [-1, 0, 1]
        var dx = deltas[Math.floor(Math.random() * deltas.length)];
        var dy = deltas[Math.floor(Math.random() * deltas.length)];
        var newLoc = (x + dx).toString() + ',' + (y + dy).toString()
        var newTileType = tiles[newLoc]
        if (!(items[newLoc]) && !(newItems[newLoc])
            && !(newTileType && Interactions.tileDefs[newTileType].action == 'blocks')) {
          newItems[newLoc] = type
          setNewItem = true
        }
      }
    } else if (Interactions.itemDefs[type].type === 'product') {
      if (tileType && Interactions.tileDefs[tileType].action == 'sells') {
        money += Interactions.itemDefs[type].sells
        setNewItem = true
      /*} else if (tileType && Interactions.tileDefs[tileType].action == 'grinds'
          && Interactions.itemDefs[type].packs) { //move blood down
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = type
          setNewItem = true
        }*/
      }
      if (!setNewItem && tileType && Interactions.tileDefs[tileType].action == 'packs'
          && Interactions.itemDefs[type].packs && Math.random() < PACK_PROB) {
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = Interactions.itemDefs[type].packs
          setNewItem = true
        }
      }
      if (!setNewItem && downTileType && Interactions.tileDefs[downTileType].action == 'packs'
          && Interactions.itemDefs[type].packs) {
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = type
          setNewItem = true
        }
      }
      if (!setNewItem && tileType && Interactions.tileDefs[tileType].action == 'cooks'
          && Interactions.itemDefs[type].cooks
          && Math.random() < COOK_PROB) {
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = Interactions.itemDefs[type].cooks
          setNewItem = true
        }
      }
      if (!setNewItem && downTileType && Interactions.tileDefs[downTileType].action == 'cooks'
          && Interactions.itemDefs[type].cooks) {
        if (!(items[downLoc]) && !(newItems[downLoc])) {
          newItems[downLoc] = type
          setNewItem = true
        }
      }
      if (!setNewItem && tileType && Interactions.tileDefs[tileType].action == 'moves') {
        var dx = Interactions.tileDefs[tileType].movex
        var dy = Interactions.tileDefs[tileType].movey
        var newLoc = (x + dx).toString() + ',' + (y + dy).toString()
        if (!(items[newLoc]) && !(newItems[newLoc])) {
          newItems[newLoc] = type
          setNewItem = true
        }
      }
    }

    if (!setNewItem) {
      newItems[loc] = type
    }
  }

  items = newItems
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
  util.log('New player has connected: ' + client.id)

  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect)

  // Listen for new player message
  client.on('new player', onNewPlayer)

  // Listen for move player message
  client.on('move player', onMovePlayer)

  client.on('change tile', onChangeTile)

  client.on('query map', onQueryMap)

  client.on('query tile cost', onQueryTileCost)
}

// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)

  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)

  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y)
  newPlayer.id = this.id

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()})

  // Send existing players to the new player
  var i, existingPlayer
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()})
  }

  // Add new player to the players array
  players.push(newPlayer)
}

// Player has moved
function onMovePlayer (data) {
  // Find player in array
  var movePlayer = playerById(this.id)

  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)

  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()})
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
// Find player by ID
function playerById (id) {
  var i
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }

  return false
}
