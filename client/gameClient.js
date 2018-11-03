var WIDTH = 540
var HEIGHT = 960

var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'gameContainer',
    { preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('planet', 'assets/images/planet.png')

  game.load.image('spaceBG', 'assets/images/starfield.png')
  game.load.image('spaceFG', 'assets/images/dustfield.png')
  game.load.image('shout', 'assets/images/shout.png')
  game.load.image('pressshout', 'assets/images/pressShout.png')
  game.load.image('gohome', 'assets/images/gohome.png')

  game.load.spritesheet('empty', 'assets/images/empty_sheet.png', 190, 190);
  game.load.spritesheet('cactus1', 'assets/images/cactus1_sheet.png', 190, 190);

  game.load.spritesheet('beehives', 'assets/images/beehives.png', 96, 96);
  game.load.spritesheet('playerbee', 'assets/images/bigbee.png', 64, 64);
  game.load.spritesheet('items', 'assets/images/items.png', 64, 64);
  game.load.spritesheet('itemsUI', 'assets/images/itemsUI.png', 64, 64);

  game.load.spritesheet('particles', 'assets/images/particles.png', 16, 16);
}

var socket // Socket connection

var spaceBG
var spaceFG

var player = null;
var localPlayerID = null;
var MAX_ENERGY = 15 * 60;
// The base of our player
var startX = -2000 + 6000 * Math.random();
var startY = -2000 + 6000 * Math.random();

var glob = {
  currentServerTick: 0,
  intermittents: [],
  otherPlayers: [],
  planets: [],
  shouts: []
}
window.glob = glob;
var itemUIButtons = [];
var NUM_ITEM_SLOTS = 6;

var uiText
var uiHoneyBar = null;
var clickUsedByUI = false

var planetGroup
var playerGroup
var uiGroup

function create () {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  // TODO remove for release????
  game.stage.disableVisibilityChange = true;
  socket = io.connect()
  // Start listening for events
  setEventHandlers()

  game.physics.startSystem(Phaser.Physics.ARCADE)
  game.world.setBounds(-2000, -2000, 4000, 4000)

  // Our tiled scrolling background
  spaceBG = game.add.tileSprite(0, 0, WIDTH, HEIGHT, 'spaceBG')
  spaceBG.fixedToCamera = true
  spaceFG = game.add.tileSprite(0, 0, WIDTH, HEIGHT, 'spaceFG')
  spaceFG.fixedToCamera = true

  tileGroup = game.add.group();
  itemGroup = game.add.group();

  planetGroup = game.add.group();

  playerGroup = game.add.group();
  playerGroup.enableBody = true;
  uiGroup = game.add.group();
  uiGroup.fixedToCamera = true

  uiText = new UIButton(uiGroup, "pressshout", 0, 220, 80, clickShout);
  uiText = new UIButton(uiGroup, "gohome", 0, 320, 80, clickGoHome);
  uiHoneyBar = game.add.graphics(0, 0);
  uiGroup.add(uiHoneyBar);

  for (var i = 0; i < NUM_ITEM_SLOTS; i++) {
    itemUIButtons.push(new ItemUIButton(uiGroup, i, WIDTH / (2 * NUM_ITEM_SLOTS) + (i * WIDTH / NUM_ITEM_SLOTS), HEIGHT - 80));
  }
}

function clickShout () {
  if (null != player) {
    socket.emit('shout', {playerID: player.playerID})
  }
}

function onShout (data) {
  var shout = new Shout(data.playerID)
  glob.shouts.push(shout)
}

function clickGoHome () {
  if (null !== player) {
    var goto = findHomePlanet(player.playerID)
    if (null !== goto) {
      player.teleportToPlanet(goto)
    }
  }
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
  socket.on('update all planets', onUpdateAllPlanets)

  socket.on('shout', onShout);
  socket.on('chat message', onReceiveChat);
  socket.on('used honey', onUsedHoney);
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

  localPlayerID = data.playerID;
  //setupLocalPlayer(localPlayerID);

  socket.emit("query all planets", {});
}

function setupLocalPlayer (playerID) {
  var home = findHomePlanet(playerID);
  if (home) {
    startX = home.gameObj.x;
    startY = home.gameObj.y;
  }

  player = new LocalPlayer(playerID, playerGroup, startX, startY, Player.generateNewInfo(playerID));

  if (home) {
    player.teleportToPlanet(home);
  }

  game.camera.follow(player.gameObj, Phaser.Camera.FOLLOW_LOCKON, 0.3, 0.3);
  game.camera.focusOnXY(startX, startY);
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.playerID)

  // Add new player to the remote players array
  var remote = new RemotePlayer(data.playerID, playerGroup, data.x, data.y, data.info);
  glob.otherPlayers.push(remote)
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
  // TODO REMOVE
  console.log("update player " + data.playerID)
  console.log(data)
  if (null != player && data.playerID === player.playerID) {
    player.setInfo(data)
  } else {
    var otherPlayer = playerByID(data.playerID)
    if (null != otherPlayer) {
      otherPlayer.setInfo(data)
    }
  }
}

function onUpdatePlanetInfo (data) {
  var planet = planetByID(data.planetID)
  if (null == planet) {
    var planet = new LocalPlanet(data.planetID, planetGroup, data) // create offscreen
    glob.planets.push(planet)
  } else {
    planet.setInfo(data)
  }
}

function onUpdateAllPlanets (data) {
  for (var i = 0; i < data.length; i++) {
    onUpdatePlanetInfo(data[i]);
  }

  if (!player) {
    // setup the player here to put them on their home planet hopefully
    setupLocalPlayer(localPlayerID);
  }
}


function update () {
  if (player) {
    player.update();
  }
  for (var i = 0; i < glob.intermittents.length; i++) {
    glob.intermittents[i].update();
    if (glob.intermittents[i].finished) {
        glob.intermittents.splice(i, 1);
        i--;
    }
  }
  for (var i = 0; i < glob.otherPlayers.length; i++) {
    glob.otherPlayers[i].update();
  }
  for (var i = 0; i < glob.planets.length; i++) {
    var planet = glob.planets[i];
    if (player && player.distance(planet.gameObj) < 700) {
      glob.planets[i].update();
    }
  }
  for (var i = 0; i < glob.shouts.length; i++) {
    glob.shouts[i].update();
  }
  spaceBG.tilePosition.x = -game.camera.x / 3;
  spaceBG.tilePosition.y = -game.camera.y / 3;
  spaceFG.tilePosition.x = -game.camera.x;
  spaceFG.tilePosition.y = -game.camera.y;

  updateUI();
}

function updateUI () {
  for (var i = 0; i < NUM_ITEM_SLOTS; i++) {
    itemUIButtons[i].updateGFX();
  }
  if (player) {
    uiHoneyBar.clear();
    // fill 1
    var fill1 = CommonUtil.clamp(player.flightTimeLeft / MAX_ENERGY, 0, 1);
    // set a fill and line style
    uiHoneyBar.beginFill(0xFFdf00);
    uiHoneyBar.lineStyle(3, 0xffdfaf, 1);
    var width = (WIDTH - 20) * fill1;
    uiHoneyBar.drawRect(10, HEIGHT - 20, width, 10);
    // fill 2
    var fill2 = CommonUtil.clamp((player.flightTimeLeft - MAX_ENERGY) / MAX_ENERGY, 0, 1);
    // set a fill and line style
    uiHoneyBar.beginFill(0xffaf00);
    uiHoneyBar.lineStyle(3, 0xffaf8f, 1);
    var width = (WIDTH - 20) * fill2;
    uiHoneyBar.drawRect(10, HEIGHT - 20, width, 10);
    // fill 3
    var fill3 = CommonUtil.clamp((player.flightTimeLeft - 2 * MAX_ENERGY) / MAX_ENERGY, 0, 1);
    // set a fill and line style
    uiHoneyBar.beginFill(0xaf00ff);
    uiHoneyBar.lineStyle(3, 0xaf8fff, 1);
    var width = (WIDTH - 20) * fill3;
    uiHoneyBar.drawRect(10, HEIGHT - 20, width, 10);
  }

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

function findHomePlanet (playerID) {
  for (var i = 0; i < glob.planets.length; i++) {
    if (glob.planets[i].info.owner === playerID) {
      return glob.planets[i]
    }
  }
  return null
}

// TEMP CHAT SYSTEM
function onReceiveChat(msg) {
    //$('#messages').prepend($('<li>').text(msg));
}

function onUsedHoney(_) {
  if (player) {
    player.flightTimeLeft += MAX_ENERGY;
  }
}
