var game = new Phaser.Game(513, 912, Phaser.AUTO, 'gameContainer',
    { preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('planet', 'assets/images/planet.png')

  game.load.image('spaceBG', 'assets/images/starfield.png')
  game.load.image('spaceFG', 'assets/images/dustfield.png')
  game.load.image('shout', 'assets/images/shout.png')
  game.load.image('pressshout', 'assets/images/pressShout.png')

  game.load.spritesheet('empty', 'assets/images/empty_sheet.png', 180, 180)
  game.load.spritesheet('cactus1', 'assets/images/cactus1_sheet.png', 180, 180)

  game.load.spritesheet('playerbee', 'assets/images/bigbee.png', 64, 64)
}

var socket // Socket connection

var spaceBG
var spaceFG

var player
// The base of our player
var startX = 0
var startY = 0

var glob = {
  currentServerTick: 0,
  intermittents: [],
  otherPlayers: [],
  planets: [],
  shouts: []
}
window.glob = glob

var selectedItemIndex = 0
var itemCostStr = '...'
var uiText
var uiIcon
var UI_BACK_POS = {x: (-448 + 0), y: (-252 + 0)}
var UI_ICON_POS = {x: (-448 + 15), y: (-252 + 36)}
var UI_TEXT_POS = {x: (-448 + 60), y: (-252 + 30)}
var clickUsedByUI = false

var planetGroup
var playerGroup
var uiGroup

function create () {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  // TODO remove for release????
  game.stage.disableVisibilityChange = true;
  socket = io.connect()
  Kii.initializeWithSite("l1rxzy4xclvo", "f662ebb1125548bc84626f5264eb11b4", KiiSite.US)
  // Start listening for events
  setEventHandlers()

  game.physics.startSystem(Phaser.Physics.ARCADE)
  game.world.setBounds(-2000, -2000, 4000, 4000)

  // Our tiled scrolling background
  spaceBG = game.add.tileSprite(0, 0, 513, 912, 'spaceBG')
  spaceBG.fixedToCamera = true
  spaceFG = game.add.tileSprite(0, 0, 513, 912, 'spaceFG')
  spaceFG.fixedToCamera = true

  tileGroup = game.add.group();
  itemGroup = game.add.group();

  planetGroup = game.add.group();

  playerGroup = game.add.group();
  playerGroup.enableBody = true;
  uiGroup = game.add.group();
  uiGroup.fixedToCamera = true

  uiText = uiGroup.create(250, 150, "pressshout")
  uiText.anchor.setTo(0.5, 0.5)
  uiText.inputEnabled = true;
  uiText.events.onInputDown.add(clickShout, uiText);
}

function clickShout () {
  clickUsedByUI = true // ALWAYS DO THIS FIRST
  if (null != player) {
    socket.emit('shout', {playerID: player.playerID})
  }
}

function onShout (data) {
  var shout = new Shout(data.playerID)
  glob.shouts.push(shout)
}

function setEventHandlers () {
  // Socket connection successful
  socket.on('connect', onSocketConnected)

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect)

  // log in with cached ID
  socket.on('confirm id', onConfirmID)
  // New player message received
  socket.on('new player', onNewPlayer)
  // Player move message received
  socket.on('move player', onMovePlayer)
  // Player removed message received
  socket.on('remove player', onRemovePlayer)

  socket.on('server tick', onServerTick)

  socket.on('update player info', onUpdatePlayerInfo)
  socket.on('update planet info', onUpdatePlanetInfo)

  socket.on('shout', onShout)
  socket.on('chat message', onReceiveChat)
  // server side only
  //socket.on('change tile', onChangeTile)
}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

  var preferredID = window.localStorage.getItem("preferredID")
  // Send local player data to the game server
  socket.emit('new player', { preferredID: preferredID, x: startX, y: startY })
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

function onConfirmID (data) {
  console.log("confirmed my ID: " + data.playerID)
  window.localStorage.setItem("preferredID", data.playerID)

  tryKiiLogin(data.playerID, function () {
    player = new LocalPlayer(data.playerID, playerGroup, startX, startY, Player.generateNewInfo(data.playerID))

    game.camera.follow(player.gameObj, Phaser.Camera.FOLLOW_TOPDOWN_TIGHT, 0.3, 0.3)
    game.camera.focusOnXY(startX, startY)

    queryPlayerInfo(player, player.playerID)
    queryAllPlanets()
  })
}

function tryKiiLogin (playerID, successCallback) {
  var username = playerID;
  var password = "password9001";
  KiiUser.authenticate(username, password).then(function (user) {
    console.log("Kii User authenticated: " + JSON.stringify(user));
    successCallback()
  }).catch(function (error) {
    var errorString = error.message;
    console.log("Unable to authenticate user: " + errorString + "...attempting signup");
    var user = KiiUser.userWithUsername(username, password);
    user.register().then(function (user) {
      console.log("User registered: " + JSON.stringify(user));
      successCallback()
    }).catch(function(error) {
      var errorString = "" + error.code + error.message;
      console.log("Unable to register user: " + errorString + "... reload I guess?");
    });
  });
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.playerID)

  // Add new player to the remote players array
  var remote = new RemotePlayer(data.playerID, playerGroup, data.x, data.y)
  glob.otherPlayers.push(remote)
  queryPlayerInfo(remote, data.playerID)
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerByID(data.playerID)

  // Player not found
  if (null == movePlayer) {
    console.log('Player not found: ', data.playerID)
    return
  }

  movePlayer.setTargetPos(data.x, data.y)
  movePlayer.gameObj.angle = data.angle
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerByID(data.playerID)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.playerID)
    return
  }

  playerGroup.remove(removePlayer.gameObj)
  removePlayer.gameObj.kill()

  // Remove player from array
  glob.otherPlayers.splice(glob.otherPlayers.indexOf(removePlayer), 1)
}

function onServerTick (data) {
  glob.currentServerTick = data.serverTicks
}

function onUpdatePlayerInfo (data) {
  if (null != player && data.playerID === player.playerID) {
    queryPlayerInfo(player, data.playerID)
  } else {
    var otherPlayer = playerByID(data.playerID)
    if (null != otherPlayer) {
      queryPlayerInfo(otherPlayer, data.playerID)
    }
  }
}

function onUpdatePlanetInfo (data) {
  var planet = planetByID(data.planetID)
  if (null == planet) {
    console.log("Creating new planet to query: " + data.planetID)
    var fakeInfo = Planet.generateNewInfo(data.planetID, -4000, -4000, "")
    var planet = new LocalPlanet(data.planetID, planetGroup, fakeInfo) // create offscreen
    glob.planets.push(planet)
  }
  queryPlanetInfo(planet, data.planetID)
}

function queryPlayerInfo (playerObj, playerID) {
  if (null == playerObj) {
    return
  }
  var queryObject = KiiQuery.queryWithClause(KiiClause.equals("playerid", playerID));
  queryObject.sortByDesc("_created");

  var bucket = Kii.bucketWithName("PlayerInfo");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    if (result.length > 0) {
      if (result.length > 1) {
        console.log("Multiple PlayerInfos for " + playerID)
      }
      console.log(playerID + ": PlayerInfo query successful")
      playerObj.setInfo(result[0]["_customInfo"])
    } else {
      console.log(playerID + ": PlayerInfo query failed, returned no objects")
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log(playerID + ": PlayerInfo query failed, unable to execute query: " + errorString);
  });
}

function queryPlanetInfo(planetObj, planetID) {
  if (null == planetObj) {
    return
  }
  var queryObject = KiiQuery.queryWithClause(KiiClause.equals("planetid", planetID));
  queryObject.sortByDesc("_created");

  var bucket = Kii.bucketWithName("Planets");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    if (result.length > 0) {
      if (result.length > 1) {
        console.log("Multiple Planets for " + planetID)
      }
      console.log(planetID + ": Planet query successful")
      planetObj.setInfo(result[0]._customInfo)
    } else {
      console.log(planetID + ": Planet query failed, returned no objects")
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log(planetID + ": Planet query failed, unable to execute query: " + errorString);
  });
}

function queryAllPlanets() {
  for (var i = 0; i < glob.planets.length; i++) {
    glob.planets[i].gameObj.destroy()
  }
  glob.planets = []
  var queryObject = KiiQuery.queryWithClause(null);
  queryObject.sortByDesc("_created");

  var bucket = Kii.bucketWithName("Planets");
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    console.log("Successfully queried number of planets: " + result.length)
    for (var i = 0; i < result.length; i++) {
      var planetInfo = result[i]._customInfo
      var planet = new LocalPlanet(planetInfo.planetid, planetGroup, planetInfo)
      glob.planets.push(planet)
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log("All Planets query failed, unable to execute query: " + errorString);
  });
}


function getTileOrItem (tilesOrItems, x, y) {
  return tilesOrItems[x.toString() + ',' + y.toString]
}

function setTileOrItem (tilesOrItems, x, y, id) {
  tilesOrItems[x.toString() + ',' + y.toString] = id
}

var MAXCOUNT = 20
var countdown = MAXCOUNT
var MAXKEYCOUNT = 8
var keyCountdown = MAXKEYCOUNT
var ZERO_POINT = new Phaser.Point(0, 0)
function update () {
  if (null != player) {
    player.update()
  }
  for (var i = 0; i < glob.intermittents.length; i++) {
    glob.intermittents[i].update()
    if (glob.intermittents[i].finished) {
        glob.intermittents.splice(i, 1)
        i--
    }
  }
  for (var i = 0; i < glob.otherPlayers.length; i++) {
    glob.otherPlayers[i].update()
  }
  for (var i = 0; i < glob.planets.length; i++) {
    glob.planets[i].update()
  }
  for (var i = 0; i < glob.shouts.length; i++) {
    glob.shouts[i].update()
  }
  spaceBG.tilePosition.x = -game.camera.x / 3
  spaceBG.tilePosition.y = -game.camera.y / 3
  spaceFG.tilePosition.x = -game.camera.x
  spaceFG.tilePosition.y = -game.camera.y
  //uiGroup.x = game.camera.x - UI_BACK_POS.x
  //uiGroup.y = game.camera.y - UI_BACK_POS.y

  updateUI()
}

function updateUI () {
  if (!game.input.activePointer.isDown) {
    clickUsedByUI = false
  }
}

function render () {

}

function playerByID (playerID) {
  for (var i = 0; i < glob.otherPlayers.length; i++) {
    if (glob.otherPlayers[i].playerID === playerID) {
      return glob.otherPlayers[i]
    }
  }
  return null
}

function planetByID (planetID) {
  for (var i = 0; i < glob.planets.length; i++) {
    if (glob.planets[i].planetID === planetID) {
      return glob.planets[i]
    }
  }
  return null
}

// TEMP CHAT SYSTEM
function onReceiveChat(msg) {
    $('#messages').prepend($('<li>').text(msg));
}
