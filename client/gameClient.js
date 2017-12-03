/* global Phaser RemotePlayer io */

var tileSprites = {
  0: 'delete',
  1: 'downarrow',
  2: 'uparrow',
  3: 'leftarrow',
  4: 'rightarrow',
  5: 'blender',
  6: 'pigbarn',
  7: 'moneybag',
  8: 'oven',
  9: 'packer',

  10: 'chickencoop',
  11: 'cave',
  12: 'alienufo',

  13: 'fence',
}

var tileNames = {
  0: 'Delete',
  1: 'Down Conveyor',
  2: 'Up Conveyor',
  3: 'Left Conveyor',
  4: 'Right Conveyor',
  5: 'Blender',
  6: 'Pig Barn',
  7: 'Seller',
  8: 'Oven',
  9: 'Packer',

  10: 'Chicken Coop',
  11: 'Smelly Cave',
  12: 'SPACESHIP',
  13: 'Fence',
}

var tileDisplayOrder = [2, 1, 3, 4, 13, 5, 9, 8, 7, 6, 10, 11, 12, 0]

var itemSprites = {
  1: 'blood',
  2: 'rawhotdog',
  3: 'hotdog',
  4: 'pigsubject',

  5: 'chickenfeathers',
  6: 'rawchickenhotdog',
  7: 'chickenhotdog',
  8: 'chickensubject',

  9: 'bloodhead',
  10: 'rawhumanhotdog',
  11: 'humanhotdog',
  12: 'humansubject',

  13: 'alienblood',
  14: 'rawalienhotdog',
  15: 'alienhotdog',
  16: 'aliensubject',
}

var game = new Phaser.Game(513, 912, Phaser.AUTO, 'gameContainer',
    { preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('downarrow', 'assets/images/downarrow.png')
  game.load.image('uparrow', 'assets/images/uparrow.png')
  game.load.image('leftarrow', 'assets/images/leftarrow.png')
  game.load.image('rightarrow', 'assets/images/rightarrow.png')
  game.load.image('blender', 'assets/images/blender.png')
  game.load.image('moneybag', 'assets/images/moneybag.png')
  game.load.image('oven', 'assets/images/oven.png')
  game.load.image('packer', 'assets/images/packer.png')
  game.load.image('fence', 'assets/images/fence.png')

  game.load.image('cave', 'assets/images/cave.png')
  game.load.image('alienufo', 'assets/images/alienufo.png')
  game.load.image('chickencoop', 'assets/images/chickencoop.png')
  game.load.image('pigbarn', 'assets/images/pigbarn.png')

  game.load.image('blood', 'assets/images/blood.png')
  game.load.image('rawhotdog', 'assets/images/rawhotdog.png')
  game.load.image('hotdog', 'assets/images/hotdog.png')
  game.load.image('pigsubject', 'assets/images/pigsubject.png')

  game.load.image('alienblood', 'assets/images/alienblood.png')
  game.load.image('rawalienhotdog', 'assets/images/rawalienhotdog.png')
  game.load.image('alienhotdog', 'assets/images/alienhotdog.png')
  game.load.image('aliensubject', 'assets/images/aliensubject.png')

  game.load.image('chickenfeathers', 'assets/images/chickenfeathers.png')
  game.load.image('rawchickenhotdog', 'assets/images/rawchickenhotdog.png')
  game.load.image('chickenhotdog', 'assets/images/chickenhotdog.png')
  game.load.image('chickensubject', 'assets/images/chickensubject.png')

  game.load.image('bloodhead', 'assets/images/bloodhead.png')
  game.load.image('rawhumanhotdog', 'assets/images/rawhumanhotdog.png')
  game.load.image('humanhotdog', 'assets/images/humanhotdog.png')
  game.load.image('humansubject', 'assets/images/humansubject.png')

  game.load.image('selected', 'assets/images/selected.png')
  game.load.image('selectedme', 'assets/images/selectedme.png')
  game.load.image('delete', 'assets/images/delete.png')

  game.load.image('planet', 'assets/images/planet.png')

  game.load.image('spaceBG', 'assets/images/starfield.png')
  game.load.image('spaceFG', 'assets/images/dustfield.png')
  game.load.image('ui', 'assets/images/UI.png')

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
  intermittents: [],
  otherPlayers: [],
  planets: [],
}
window.glob = glob

var tiles
var items
var money = 0

var selectedItemIndex = 0
var itemCostStr = '...'
var uiText
var uiIcon
var UI_BACK_POS = {x: (-448 + 0), y: (-252 + 0)}
var UI_ICON_POS = {x: (-448 + 15), y: (-252 + 36)}
var UI_TEXT_POS = {x: (-448 + 60), y: (-252 + 30)}

var currentSpeed = 0
var cursors

var GRID_SIZE = 16

var tileGroup
var itemGroup
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

  // Init all the player stuff in the confirm ID callback


  // cave, blender, packer, oven, moneybag
  tiles = {}
  items = {}

  uiGroup.create(UI_BACK_POS.x, UI_BACK_POS.y, 'ui')
  uiIcon = game.add.sprite(UI_ICON_POS.x, UI_ICON_POS.y, 'uparrow')
  uiGroup.add(uiIcon)
  uiText = game.add.text(UI_TEXT_POS.x, UI_TEXT_POS.y, "...", {font: 'Courier 10pt'})
  uiGroup.add(uiText)
  selectUIElement(0)

  // TODO MAKE Kii create these
  for (var i = 0; i < 8; i++) {
    var planet = new Planet("doop", game, planetGroup, -1500 + Math.random() * 3000, -1500 + Math.random() * 3000, .4 + Math.random() * .1)
    glob.planets.push(planet)
  }
}

var setEventHandlers = function () {
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

  // map was updated
  socket.on('update map', onMapUpdate)

  socket.on('update tile cost', onUpdateTileCost)

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

  player = new LocalPlayer(data.playerID, playerGroup, startX, startY)

  game.camera.follow(player.gameObj, Phaser.Camera.FOLLOW_TOPDOWN_TIGHT, 0.3, 0.3)
  game.camera.focusOnXY(startX, startY)
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.playerID)

  // Add new player to the remote players array
  var remote = new RemotePlayer(data.playerID, playerGroup, data.x, data.y)
  glob.otherPlayers.push(remote)
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerByPlayerID(data.playerID)

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
  var removePlayer = playerByPlayerID(data.playerID)

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

function onMapUpdate (data) {
  var tempItems = data.items
  var tempTiles = data.tiles
  money = data.money

  for (var loc in tiles) {
    if (tiles.hasOwnProperty(loc) && tiles[loc] != null) {
      tileGroup.remove(tiles[loc], true)
      tiles[loc] = null
    }
  }
  for (var loc in items) {
    if (items.hasOwnProperty(loc) && items[loc] != null) {
      itemGroup.remove(items[loc], true)
      items[loc] = null
    }
  }

  for (var loc in data.tiles) {
    var tileId = data.tiles[loc]
    if (tileId) {
      var bits = loc.split(',')
      var x = parseInt(bits[0])
      var y = parseInt(bits[1])
      tiles[loc] = tileGroup.create(x * 16, y * 16, tileSprites[tileId])
      //tiles[loc] = game.add.sprite(x * 16, y * 16, tileSprites[tileId])
    }
  }
  for (var loc in data.items) {
    var itemId = data.items[loc]
    if (itemId) {
      var bits = loc.split(',')
      var x = parseInt(bits[0])
      var y = parseInt(bits[1])
      items[loc] = itemGroup.create(x * 16, y * 16, itemSprites[itemId])
      //items[loc] = game.add.sprite(x * 16, y * 16, itemSprites[itemId])
    }
  }
}

function onUpdateTileCost (data) {
  itemCostStr = data.cost.toString()
  updateUI()
}

function selectUIElement (indexDelta) {
  selectedItemIndex += indexDelta
  if (selectedItemIndex >= tileDisplayOrder.length) {
    selectedItemIndex -= tileDisplayOrder.length
  }
  if (selectedItemIndex < 0) {
    selectedItemIndex += tileDisplayOrder.length
  }
  itemCostStr = '...'
  data = {tileId: tileDisplayOrder[selectedItemIndex]}
  socket.emit('query tile cost', data)
  updateUI()
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
  spaceBG.tilePosition.x = -game.camera.x / 3
  spaceBG.tilePosition.y = -game.camera.y / 3
  spaceFG.tilePosition.x = -game.camera.x
  spaceFG.tilePosition.y = -game.camera.y
  //uiGroup.x = game.camera.x - UI_BACK_POS.x
  //uiGroup.y = game.camera.y - UI_BACK_POS.y

  updateUI()

  countdown--
  if (countdown === 0) {
    countdown = MAXCOUNT
    socket.emit('query map', {})
  }
}

function updateUI () {
  var tileId = tileDisplayOrder[selectedItemIndex]

  uiGroup.remove(uiIcon)
  uiIcon.destroy(true)
  uiIcon = game.add.sprite(UI_ICON_POS.x, UI_ICON_POS.y, tileSprites[tileId])
  uiGroup.add(uiIcon)
  uiIcon.bringToTop()
  uiText.setText(tileNames[tileId] + '\nCost: ' + itemCostStr
      + '\nMoney: ' + money.toString())
}

function render () {

}

// Find player by ID
function playerByPlayerID (playerID) {
  for (var i = 0; i < glob.otherPlayers.length; i++) {
    if (glob.otherPlayers[i].playerID === playerID) {
      return glob.otherPlayers[i]
    }
  }

  return null
}

// TEMP CHAT SYSTEM
function onReceiveChat(msg) {
    $('#messages').prepend($('<li>').text(msg));
}
