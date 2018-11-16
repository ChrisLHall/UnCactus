var WIDTH = 540
var HEIGHT = 960
var WORLD_SIZE = 10000; // also in the server

var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.CANVAS, 'gameContainer',
    { preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('planet_1', 'assets/images/planet_1.png');
  game.load.image('planet_2', 'assets/images/planet_2.png');
  game.load.image('planet_3', 'assets/images/planet_3.png');

  game.load.image('spaceBG', 'assets/images/starfield.png');
  game.load.image('spaceFG', 'assets/images/dustfield.png');
  game.load.image('shout', 'assets/images/shout.png');
  game.load.image('pressshout', 'assets/images/pressShout.png');
  game.load.image('gohome', 'assets/images/gohome.png');

  game.load.spritesheet('empty', 'assets/images/empty_sheet.png', 190, 190);
  game.load.spritesheet('cactus_1', 'assets/images/cactus_1_sheet.png', 190, 190);
  game.load.spritesheet('cactus_2', 'assets/images/cactus_2_sheet.png', 190, 190);
  game.load.spritesheet('cactus_3', 'assets/images/cactus_3_sheet.png', 190, 190);

  game.load.spritesheet('beehive', 'assets/images/beehive.png', 96, 96);
  game.load.spritesheet('emptybeehive', 'assets/images/emptybeehive.png', 96, 96);
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
var MAX_ENERGY = 20 * 60;
// The base of our player
var startX = 0;
var startY = 0;

var glob = {
  currentServerTick: 0,
  intermittents: [],
  otherPlayers: {},
  otherPlayerObjs: {},
  planets: {},
  planetObjs: {},
  shouts: []
}
window.glob = glob;
var itemUIButtons = [];
var homePlanetButtons = [];
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
  socket = io.connect();
  // Start listening for events
  setEventHandlers();

  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.world.setBounds(-WORLD_SIZE / 2, -WORLD_SIZE / 2, WORLD_SIZE, WORLD_SIZE);

  // Our tiled scrolling background
  spaceBG = game.add.tileSprite(0, 0, WIDTH, HEIGHT, 'spaceBG');
  spaceBG.fixedToCamera = true;
  spaceFG = game.add.tileSprite(0, 0, WIDTH, HEIGHT, 'spaceFG');
  spaceFG.fixedToCamera = true;

  tileGroup = game.add.group();
  itemGroup = game.add.group();

  planetGroup = game.add.group();

  playerGroup = game.add.group();
  playerGroup.enableBody = true;
  uiGroup = game.add.group();
  uiGroup.fixedToCamera = true

  uiText = new UIButton(uiGroup, "pressshout", 0, 220, 80, clickShout);
  for (var i = 0; i < 3; i++) {
    homePlanetButtons.push(new HomeUIButton(uiGroup, i, 320 + 80 * i, 80));
  }
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
  var homePlanets = findHomePlanets(playerID);
  var home = homePlanets.length > 0 ? homePlanets[0] : null;
  if (home) {
    startX = home.x;
    startY = home.y;
  }

  player = new LocalPlayer(playerID, playerGroup, startX, startY, Player.generateNewInfo(playerID));

  if (home) {
    player.teleportToPlanet(home.planetID);
  }
  updateSpawnedObjs();
  glob.intermittents.push(new IntermittentUpdater(player, updateSpawnedObjs, 60))

  game.camera.follow(player.gameObj, Phaser.Camera.FOLLOW_LOCKON, 0.3, 0.3);
  game.camera.focusOnXY(startX, startY);
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.playerID)

  // Add new player to the remote players array
  var remote = new RemotePlayer(data.playerID, playerGroup, data.x, data.y, data.info);
  glob.otherPlayers[data.playerID] = remote;
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

  // TODO ALSO REMOVE IT FROM THE ARRAY OF INSTANCES
  // Remove player from array
  if (glob.otherPlayers.hasOwnProperty(data.playerID)) {
    delete glob.otherPlayers[data.playerID];
  }
}

function onServerTick (data) {
  glob.currentServerTick = data.serverTicks
}

function onUpdatePlayerInfo (data) {
  if (player && data.playerID === player.playerID) {
    player.setInfo(data)
    console.log("Set local player info");
  } else {
    var otherPlayer = playerByID(data.playerID)
    if (otherPlayer) {
      otherPlayer.setInfo(data)
      console.log("Set remote player info " + data.playerID);
    }
  }
}

// TODO change how this works with null bc this fn should not be changing the available planet IDs
function onUpdatePlanetInfo (data) {
  glob.planets[data.planetID] = data;
  var planet = planetObjByID(data.planetID);
  if (null !== planet) {
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
  for (var playerID in glob.otherPlayers) {
    if (glob.otherPlayers.hasOwnProperty(playerID)) {
      glob.otherPlayers[playerID].update();
    }
  }
  for (var planetID in glob.planetObjs) {
    if (glob.planetObjs.hasOwnProperty(planetID)) {
      var planetObj = glob.planetObjs[planetID];
      if (player && CommonUtil.withinXY(player.gameObj, planetObj.gameObj, 400, 700)) {
        planetObj.update();
      }
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
  for (var i = 0; i < 3; i++) {
    homePlanetButtons[i].updateGFX();
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

function updateSpawnedObjs () {
  if (null === player) {
    return; // not ready yet
  }

  var existing = 0;
  for (var planetID in glob.planets) {
    if (glob.planets.hasOwnProperty(planetID)) {
      var planetInfo = glob.planets[planetID];
      var shouldExist = CommonUtil.withinXY(player.gameObj, planetInfo, 600, 1000);
      if (shouldExist && !glob.planetObjs.hasOwnProperty(planetID)) {
        glob.planetObjs[planetID] = new LocalPlanet(planetID, planetGroup, planetInfo);
        console.log("created " + planetID);
      } else if (!shouldExist && glob.planetObjs.hasOwnProperty(planetID)) {
        glob.planetObjs[planetID].destroy();
        delete glob.planetObjs[planetID];
        console.log("destroyed " + planetID);
      }
      if (shouldExist) {
        existing++;
      }
    }
  }
  // TODO the same for remote players? only if it becomes necessary.
}

function render () {

}

function playerByID (playerID) {
  if (glob.otherPlayers.hasOwnProperty(playerID)) {
    return glob.otherPlayers[playerID];
  }
  return null;
}

function planetByID (planetID) {
  if (glob.planets.hasOwnProperty(planetID)) {
    return glob.planets[planetID];
  }
  return null;
}

function planetObjByID (planetID) {
  if (glob.planetObjs.hasOwnProperty(planetID)) {
    return glob.planetObjs[planetID];
  }
  return null;
}

function findHomePlanets (playerID) {
  var result = [];
  for (var planetID in glob.planets) {
    if (glob.planets.hasOwnProperty(planetID)) {
      var planetInfo = glob.planets[planetID];
      if (planetInfo.owner === playerID) {
        result.push(planetInfo);
      }
    }
  }
  result.sort(function (a,b) {return a.planetID.localeCompare(b.planetID);});
  return result;
}

// TEMP CHAT SYSTEM
function onReceiveChat(msg) {
    //$('#messages').prepend($('<li>').text(msg));
}

// TODO server sided movement?
function onUsedHoney(data) {
  var mult = (data.type === "superhoney") ? 2 : 1;
  if (player) {
    player.flightTimeLeft += MAX_ENERGY * mult;
  }
}
