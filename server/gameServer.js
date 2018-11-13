var util = require('util')
var path = require('path')
express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http, {origins:'localhost:* 192.168.*.*:* http://chrislhall.net:* http://www.chrislhall.net:* http://chrislhall.net/bees http://www.chrislhall.net/bees'})
var uuidv4 = require('uuid/v4')

var Player = require('../common/Player')
var Plot = require('../common/Plot')
var Planet = require('../common/Planet')
//Planet.generatePlotInfo = Plot.generateNewInfo

var CommonUtil = require('../common/CommonUtil')
var kii = require('kii-cloud-sdk').create()
var KiiServerCreds = require('./KiiServerCreds')()
var readline = require('readline')
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var port = process.env.PORT || 4545;
var WORLD_SIZE = 10000; // also in the client

var players = []	// Array of connected players
var planets = []// Array of planets

var BUCKET_SUFFIX = "";

/* ************************************************
** GAME INITIALISATION
************************************************ */

app.use(express.static(path.resolve(__dirname, '../build')))
http.listen(port, function (err) {
  if (err) {
    throw err
  }

  if (process.argv.length >= 3 && process.argv[2] === "dev") {
    console.log("Using DEV databases");
    BUCKET_SUFFIX = "_DEV";
  } else {
    console.log("Using production databases");
  }

  initializeKii()
})

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

  var bucket = kii.Kii.bucketWithName("Metadata" + BUCKET_SUFFIX);
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

  queryAllPlanets();

  // Start listening for events
  setEventHandlers();
  setInterval(saveToServer, 250);
  setInterval(tick, 10000);
}

var lastSavedPlanetIdx = 0;
function saveToServer () {
  // try to save at least 1 planet per second
  lastSavedPlanetIdx++;
  if (lastSavedPlanetIdx >= planets.length) {
    lastSavedPlanetIdx = 0;
  }
  for (; lastSavedPlanetIdx < planets.length; lastSavedPlanetIdx++) {
    if (planets[lastSavedPlanetIdx].changed) {
      //console.log("Saving planet " + planets[lastSavedPlanetIdx].planetID + " idx " + lastSavedPlanetIdx);
      savePlanetInfo(planets[lastSavedPlanetIdx]);
      break;
    }
  }
}

function tick() {
  if (!metadata.hasOwnProperty("serverTicks")) {
    metadata['serverTicks'] = 0;
  }
  metadata.serverTicks += 1;
  io.emit('server tick', {serverTicks: metadata.serverTicks})
  writeMetadata()

  processPlanets()
}

// Process the map
function processPlanets () {
  for (var planetIdx = 0; planetIdx < planets.length; planetIdx++){
    var planet = planets[planetIdx]
    var plots = planet.info.plots
    var changed = false
    for (var idx = 0; idx < 6; idx++) {
      var age = metadata.serverTicks - plots[idx].birthTick
      if (plots[idx].type === "empty") {
        if (!planet.info.owner && age > Plot.EMPTY_SPAWN_TIME && Math.random() < Plot.SPAWN_CHANCE) {
          plots[idx] = Plot.generateNewInfo("cactus", metadata.serverTicks);
          plots[idx].variant = 1;
          plots[idx].lastGrowTick = metadata.serverTicks;
          changed = true;
        }
      } else if (plots[idx].type === "cactus") {
        var stateAge = metadata.serverTicks - plots[idx].lastGrowTick;
        if (plots[idx].growState < Plot.GROWTH_AGES.length && stateAge >= Plot.GROWTH_AGES[plots[idx].growState]) {
          plots[idx].lastGrowTick = metadata.serverTicks;
          plots[idx].growState++;
          changed = true;

          if (plots[idx].growState >= 4) {
            // Past the max state: either go back to 2, or die.
            var numFlowers = Plot.MAX_FLOWERS;
            if (planet.info.owner) {
              numFlowers++;
            }
            if (plots[idx].timesFlowered >= numFlowers || Math.random() < Plot.DIE_CHANCE) {
              plots[idx] = Plot.generateNewInfo("empty", metadata.serverTicks);
            } else {
              plots[idx].growState = 2;
            }
          }

          if (plots[idx].type !== "empty") {
            if (plots[idx].growState === 2) {
              // just started flowering
              plots[idx].timesFlowered += 1;
              if (Math.random() < .5) {
                plots[idx].itemAvailable = "pollen"; // TODO pollen types
              } else {
                plots[idx].itemAvailable = "nectar";
              }
            } else if (plots[idx].growState === 3) {
              // just stopped flowering
              if (plots[idx].itemAvailable === "pollen" || plots[idx].itemAvailable === "nectar") {
                plots[idx].itemAvailable = null;
              }
              if (Math.random() < .3
                  || (plots[idx].pollinatedType && plots[idx].pollinatedType.startsWith("pollen"))) {
                plots[idx].itemAvailable = "seed";
                plots[idx].pollinatedType = null;
              }
            }
          }
        }
        if (plots[idx].growState === 2) {
          // as long as a plant is flowering, add 1 nectar
          var beehivePlotIdx = Planet.findPlotOfType(plots, "beehive");
          if (null !== beehivePlotIdx) {
            var beehivePlot = plots[beehivePlotIdx];
            beehivePlot.nectar += 1;
            beehivePlot.honeyCombCounter += 1;
          }
        }
        if (age > Plot.DIE_TIME && Math.random() < Plot.DIE_CHANCE) {
          plots[idx] = Plot.generateNewInfo("empty", metadata.serverTicks);
          changed = true;
        }
      } else if (plots[idx].type === "beehive") {
        var numHomePlanets = 0;
        if (planet.info.owner) {
          numHomePlanets = findHomePlanets(planet.info.owner).length;
        }
        if (!plots[idx].itemAvailable && plots[idx].honeyCombCounter >= 120 && numHomePlanets < 3) {
          // TODO increase to 50-100 later
          // TODO CHECK NUMBER OF HOME PLANETS
          plots[idx].itemAvailable = "honeycomb";
          plots[idx].honeyCombCounter -= 160;
          changed = true;
        } else if (!plots[idx].itemAvailable && plots[idx].nectar >= 40) {
          plots[idx].itemAvailable = "honey";
          plots[idx].nectar -= 40;
          changed = true;
        }
      }
    }
    if (changed) {
      setPlanetInfo(planet)
    }
  }
}

/*************************
 * Debug commands
 */

var lastInput = "";
rl.on('line', function (input) {
  if (input === "repeat") {
    input = lastInput;
  }
  console.log("Command input: " + input);
  var tokens = input.split(" ");
  if (tokens[0] === "quit") {
    process.exit(0);
  } else if (tokens[0] === "players") {
    DEBUGListPlayers();
  } else if (tokens[0] === "kill") {
    DEBUGKillAllPlants(DEBUGPlanetByPartialID(tokens[1]));
  } else if (tokens[0] === "plant") {
    DEBUGPlant(DEBUGPlanetByPartialID(tokens[1]));
  } else if (tokens[0] === "grow") {
    DEBUGGrow(DEBUGPlanetByPartialID(tokens[1]));
  } else if (tokens[0] === "generate") {
    DEBUGGeneratePlanets(parseInt(tokens[1]));
  } else if (tokens[0] === "give") {
    DEBUGGiveItem(DEBUGPlayerByPartialID(tokens[1]), tokens[2]);
  } else if (tokens[0] === "clearitems") {
    DEBUGClearItems(DEBUGPlayerByPartialID(tokens[1]));
  } else if (tokens[0] === "toggleowner") {
    DEBUGToggleOwnership(DEBUGPlayerByPartialID(tokens[1]), DEBUGPlanetByPartialID(tokens[2]));
  } else if (tokens[0] === "matchplayer") {
    console.log(DEBUGPlayerByPartialID(tokens[1]));
  } else if (tokens[0] === "matchplanet") {
    console.log(DEBUGPlanetByPartialID(tokens[1]));
  } else if (tokens[0] === "homeplanet") {
    DEBUGGetHomePlanets(DEBUGPlayerByPartialID(tokens[1]));
  } else {
    console.log("Unknown command.");
  }
  lastInput = input;
});

function DEBUGListPlayers () {
  for (var i = 0; i < players.length; i++) {
    console.log("Player: "+ players[i].playerID);
  }
}

function DEBUGKillAllPlants (planet) {
  if (null === planet) {
    return;
  }
  var planetPlots = planet.info.plots
  for (var slotIdx = 0; slotIdx < 6; slotIdx++) {
    if (planetPlots[slotIdx].type === "cactus") {
      planetPlots[slotIdx] = Plot.generateNewInfo("empty", metadata.serverTicks);
    }
  }
  setPlanetInfo(planet)
}

function DEBUGPlant (planet) {
  if (null === planet) {
    return;
  }
  var planetPlots = planet.info.plots
  for (var slotIdx = 0; slotIdx < 6; slotIdx++) {
    if (planetPlots[slotIdx].type === "empty") {
      planetPlots[slotIdx] = Plot.generateNewInfo("cactus", metadata.serverTicks);
      planetPlots[slotIdx].variant = 1;
      planetPlots[slotIdx].lastGrowTick = metadata.serverTicks;
    }
  }
  setPlanetInfo(planet)
}

function DEBUGGrow (planet) {
  if (null === planet) {
    return;
  }
  var planetPlots = planet.info.plots
  for (var slotIdx = 0; slotIdx < 6; slotIdx++) {
    if (planetPlots[slotIdx].type === "cactus") {
      planetPlots[slotIdx].birthTick -= 10;
    }
  }
  setPlanetInfo(planet)
}

function DEBUGGeneratePlanets (num) {
  console.log("Generating " + num);
  for (var i = 0; i < num; i++) {
    var emptyPlanet = createEmptyPlanet();
    planets.push(emptyPlanet)
    setPlanetInfo(emptyPlanet)
  }
}

function DEBUGGetHomePlanets (player) {
  if (null === player) {
    return;
  }
  console.log("Getting home planets")
  var homePlanets = findHomePlanets(player.playerID);
  for (var i = 0; i < homePlanets.length; i++) {
    console.log("Home planet " + homePlanets[i].planetID);
  }
}

function DEBUGGiveItem (player, item) {
  if (null === player) {
    return;
  }
  var invSlot = Player.firstEmptyInventorySlot(player.info);
  if (invSlot !== -1) {
    player.info.inventory[invSlot] = item;
    setPlayerInfo(player);
  }
}

function DEBUGClearItems (player) {
  if (null === player) {
    return;
  }

  for (var invSlot = 0; invSlot < player.info.inventory.length; invSlot++) {
    player.info.inventory[invSlot] = null;
    setPlayerInfo(player);
  }
}

function DEBUGToggleOwnership (player, planet) {
  if (!player || !planet) {
    return;
  }

  var plots = planet.info.plots;
  var hiveIdx = -1;
  for (var i = 0; i < plots.length; i++) {
    if (plots[i].type === "beehive" || plots[i].type === "emptybeehive") {
      hiveIdx = i;
      break;
    }
  }
  if (hiveIdx === -1) {
    console.log("No hive slot");
    return;
  }
  if (plots[hiveIdx].type === "emptybeehive") {
    plots[hiveIdx] = Plot.generateNewInfo("beehive", metadata.serverTicks);
    planet.info.owner = player.playerID;
  } else {
    plots[hiveIdx] = Plot.generateNewInfo("emptybeehive", metadata.serverTicks);
    planet.info.owner = null;
  }
  setPlanetInfo(planet);
}

function DEBUGPlayerByPartialID (partialPlayerID) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].playerID.startsWith(partialPlayerID)) {
      return players[i];
    }
  }
  return null;
}

function DEBUGPlanetByPartialID (partialPlanetID) {
  for (var i = 0; i < planets.length; i++) {
    if (planets[i].planetID.startsWith(partialPlanetID)) {
      return planets[i];
    }
  }
  return null;
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
  client.on('move player', onMovePlayer);
  client.on('collect item', onCollectItem);
  client.on('use item', onUseItem);
  client.on('delete item', onDeleteItem);
  client.on('destroy beehive', onDestroyBeehive);

  client.on('shout', onShout)
  // TEMP chat
  client.on('chat message', onReceiveChat)

  client.on('query player info', onQueryPlayerInfo)
  client.on('query planet info', onQueryPlanetInfo)
  client.on('query all planets', onQueryAllPlanets)
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
  // update the player's clock
  this.emit('server tick', {serverTicks: metadata.serverTicks})
  // Broadcast new player to other connected socket clients
  this.broadcast.emit('new player', {playerID: newPlayer.playerID, x: newPlayer.x, y: newPlayer.y, info: newPlayer.info})

  // Send existing players to the new player
  var i, existingPlayer;
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i];
    if (existingPlayer.playerID == newPlayer.playerID) {
      // boot duplicate player
      existingPlayer.socket.disconnect();
      players.splice(i, 1);
      i--;
    } else {
      this.emit('new player', { playerID: existingPlayer.playerID, x: existingPlayer.x, y: existingPlayer.y, info: existingPlayer.info });
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
  movePlayer.x = data.x;
  movePlayer.y = data.y;
  movePlayer.angle = data.angle;

  // Broadcast updated position to other connected socket clients
  this.broadcast.emit('move player', {playerID: movePlayer.playerID, x: movePlayer.x, y: movePlayer.y, angle: movePlayer.angle})
}

function onCollectItem (data) {
  var player = playerBySocket(this);
  var planet = planetByID(data.planetID);
  if (!planet || !player) {
    console.log("Unable to collect item " + player.toString() + " " + planet.toString());
    return;
  }
  var ownedBySomeoneElse = (planet.info.owner && player.playerID !== planet.info.owner);
  if (ownedBySomeoneElse) {
    // TODO REMOVE
    console.log("Player tried to take item from another player's home planet: " + player.playerID);
    return;
  }

  var plot = planet.info.plots[data.plotIdx]
  var changed = false;

  var invSlot = Player.firstEmptyInventorySlot(player.info);
  if (plot.itemAvailable && invSlot !== -1) {
    player.info.inventory[invSlot] = plot.itemAvailable;
    plot.itemAvailable = null;
    changed = true;
  }

  if (changed) {
    setPlanetInfo(planet);
    setPlayerInfo(player);
  }
}

function onUseItem (data) {
  var player = playerBySocket(this);
  var invSlot = player.info.inventory[data.slot];
  if (!player) {
    console.log("unable to use item: " + player.toString());
  }
  var planet = null;
  var plots = null;
  var idx = -1;
  if (data.targetPlanet) {
    planet = planetByID(data.targetPlanet);
    if (planet) {
      plots = planet.info.plots;
      idx = 0 || data.targetSlot;
    }
  }
  var ownedBySomeoneElse = (planet && planet.info.owner && player.playerID !== planet.info.owner);
  if (ownedBySomeoneElse) {
    // TODO REMOVE
    console.log("Player tried to use item on another player's home planet: " + player.playerID);
    return;
  }

  var planetChanged = false;
  var itemUsed = false;
  if (invSlot === "pollen" && plots) {
    if (plots[idx].type === "cactus" && null === plots[idx].pollinatedType) {
      plots[idx].pollinatedType = invSlot;
      itemUsed = true;
      planetChanged = true;
    }
  } else if (invSlot === "seed" && plots) {
    if (plots[idx].type === "empty" || plots[idx].type === "cactus") {
      plots[idx] = Plot.generateNewInfo("cactus", metadata.serverTicks);
      plots[idx].variant = 1;
      plots[idx].lastGrowTick = metadata.serverTicks;
      console.log("Seeded cactus growth state " + plots[idx].growState)
      itemUsed = true;
      planetChanged = true;
    }
  } else if (invSlot === "nectar" && plots) {
    if (plots[idx].type === "beehive") {
      plots[idx].nectar += 10;
      plots[idx].honeyCombCounter += 10;
      itemUsed = true;
      planetChanged = true;
    }
  } else if (invSlot === "honey") {
    // always use honey
    itemUsed = true;
    this.emit('used honey', {});
  } else if (invSlot === "honeycomb" && plots) {
    if (plots[idx].type === "emptybeehive") {
      plots[idx] = Plot.generateNewInfo("beehive", metadata.serverTicks);
      planet.info.owner = player.playerID;
      itemUsed = true;
      planetChanged = true;
    }
  }
  if (itemUsed) {
    player.info.inventory[data.slot] = null;
    setPlayerInfo(player);
  }
  if (planetChanged) {
    setPlanetInfo(planet);
  }
}

function onDeleteItem (data) {
  var player = playerBySocket(this);
  var invSlot = player.info.inventory[data.slot];
  if (!player) {
    console.log("unable to delete item: " + player.toString());
  }

  if (invSlot) {
    player.info.inventory[data.slot] = null;
    setPlayerInfo(player);
  }
}

function onDestroyBeehive (data) {
  var player = playerBySocket(this);
  if (!player) {
    console.log("unable destroy beehive: " + player.toString());
  }
  var planet = null;
  if (data.targetPlanet) {
    planet = planetByID(data.targetPlanet);
  }

  if (planet && planet.info.owner === player.playerID) {
    var planetPlots = planet.info.plots;
    for (var i = 0; i < planetPlots.length; i++) {
      if (planetPlots[i].type === "beehive") {
        planetPlots[i] = Plot.generateNewInfo("emptybeehive", metadata.serverTicks);
      }
    }
    planet.info.owner = null;
    setPlanetInfo(planet);
  }
}

function onShout (data) {
  io.emit("shout", data) // data just has player id
}

function onReceiveChat (msg) {
  var text = "" + this.id + ": " + msg
  console.log(text)
  io.emit("chat message", text)
}

function onQueryPlayerInfo (playerID) {
  console.log("On query player " + playerID);
  this.emit('update player info', playerByID(playerID).info)
}
function onQueryPlanetInfo (planetID) {
  console.log("On query planet " + planetID);
  this.emit('update planet info', planetByID(planetID).info)
}
function onQueryAllPlanets (_) {
  var planetList = Planet.planetListToInfoList(planets);
  this.emit('update all planets', planetList);
}

function createHomePlanet(playerID) {
  var planet = new Planet(uuidv4())
  var planetInfo = Planet.generateNewInfo(planet.planetID, -(WORLD_SIZE / 2 - 500) + Math.random() * (WORLD_SIZE - 1000), -(WORLD_SIZE / 2 - 500) + Math.random() * (WORLD_SIZE - 1000), playerID);
  planet.info = planetInfo
  var planetPlots = planet.info.plots
  var idx = Math.floor(6 * Math.random());
  planetPlots[idx] = Plot.generateNewInfo("beehive", metadata.serverTicks);
  return planet
}

function createEmptyPlanet() {
  var planet = new Planet(uuidv4())
  var planetInfo = Planet.generateNewInfo(planet.planetID, -(WORLD_SIZE / 2 - 500) + Math.random() * (WORLD_SIZE - 1000), -(WORLD_SIZE / 2 - 500) + Math.random() * (WORLD_SIZE - 1000), null);
  planet.info = planetInfo
  // Sometimes create an empty beehive
  if (Math.random() < .3) {
    console.log("Creating an empty beehive");
    planet.info.plots[Math.floor(6 * Math.random())] = Plot.generateNewInfo("emptybeehive", metadata.serverTicks);
  }
  return planet
}

function getOrInitPlayerInfo(player, playerID) {
  var queryObject = kii.KiiQuery.queryWithClause(kii.KiiClause.equals("playerID", playerID));
  queryObject.sortByDesc("_created");

  var bucket = kii.Kii.bucketWithName("PlayerInfo" + BUCKET_SUFFIX);
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
      player.socket.emit('update player info', player.info);
    } else {
      console.log(playerID + ": PlayerInfo query failed, returned no objects")
      player.info = Player.generateNewInfo(playerID);
      setPlayerInfo(player);
    }
    ensureHomePlanet(player);
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log(playerID + ": PlayerInfo query failed, unable to execute query: " + errorString);
  });
}

function setPlayerInfo(player) {
  player.socket.emit('update player info', player.info);

  var obj = player.kiiObj
  var playerInfo = player.info

  if (null == obj) {
    var bucket = kii.Kii.bucketWithName("PlayerInfo" + BUCKET_SUFFIX);
    obj = bucket.createObject();
  }
  for (var key in playerInfo) {
    if (playerInfo.hasOwnProperty(key)) {
      obj.set(key, playerInfo[key]);
    }
  }

  obj.save().then(function (obj) {
    player.kiiObj = obj;
  }).catch(function (error) {
    var errorString = "" + error.code + ": " + error.message
    console.log(player.playerID + ": Unable to create player info: " + errorString);
  });
}

function ensureHomePlanet (player) {
  var homePlanets = findHomePlanets(player.playerID);
  if (homePlanets.length <= 0) {
    console.log("Creating home planet for " + player.playerID);
    homePlanet = createHomePlanet(player.playerID)
    planets.push(homePlanet)
    setPlanetInfo(homePlanet)
  }
}

function queryAllPlanets() {
  planets = []
  var queryObject = kii.KiiQuery.queryWithClause(null);
  queryObject.sortByDesc("_created");

  var bucket = kii.Kii.bucketWithName("Planets" + BUCKET_SUFFIX);
  bucket.executeQuery(queryObject).then(function (params) {
    var queryPerformed = params[0];
    var result = params[1];
    var nextQuery = params[2]; // if there are more results
    console.log("Successfully queried number of planets: " + result.length)
    for (var i = 0; i < result.length; i++) {
      var planetResult = result[i]
      var planetInfo = planetResult._customInfo
      var planet = new Planet(planetInfo.planetID)
      planet.kiiObj = planetResult
      planet.info = Planet.validateInfo(planetInfo);
      planets.push(planet)
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log("All Planets query failed, unable to execute query: " + errorString);
  });
}

function getPlanetInfo(planet, planetID) {
  var queryObject = kii.KiiQuery.queryWithClause(kii.KiiClause.equals("planetID", planetID));
  queryObject.sortByDesc("_created");

  var bucket = kii.Kii.bucketWithName("Planets" + BUCKET_SUFFIX);
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
      CommonUtil.validate(planetInfo, Planet.generateNewInfo(planetID, 0, 0, null))
      planet.info = planetInfo
    } else {
      console.log(planetID + ": Planet query failed, returned no objects")
    }
  }).catch(function (error) {
    var errorString = "" + error.code + ":" + error.message;
    console.log(planetID + ": Planet query failed, unable to execute query: " + errorString);
  });
}

function setPlanetInfo (planet) {
  io.emit('update planet info', planet.info);
  planet.changed = true;
}

function savePlanetInfo (planet) {
  planet.changed = false;
  var obj = planet.kiiObj;
  var planetInfo = planet.info;
  if (null === obj) {
    var bucket = kii.Kii.bucketWithName("Planets" + BUCKET_SUFFIX);
    obj = bucket.createObject();
  }
  if (!planetInfo) {
    console.log("Planet has no info?? " + planet.planetID);
  }
  for (var key in planetInfo) {
    if (planetInfo.hasOwnProperty(key)) {
      obj.set(key, planetInfo[key]);
    }
  }

  obj.save().then(function (o) {
    planet.kiiObj = o;
  }).catch(function (error) {
    planet.changed = true;
    var errorString = "" + error.code + ": " + error.message
    console.log("Unable to save planet info.");
    console.log(planet.planetID + ". " + errorString);
    console.log("Info: " + util.inspect(planetInfo, false, null));
  });
}

/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID....maybe no need?
function playerByID (playerID) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].playerID === playerID) {
      return players[i];
    }
  }
  return null;
}

function playerBySocket (socket) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].socket === socket) {
      return players[i];
    }
  }
  return null;
}

function planetByID (planetID) {
  for (var i = 0; i < planets.length; i++) {
    if (planets[i].planetID === planetID) {
      return planets[i];
    }
  }
  return null;
}

function findHomePlanets (playerID) {
  var result = []
  for (var i = 0; i < planets.length; i++) {
    if (planets[i].info.owner === playerID) {
      result.push(planets[i]);
    }
  }
  result.sort(function (a,b) {return a.planetID.localeCompare(b.planetID);});
  return result;
}
