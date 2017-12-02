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

var game = new Phaser.Game(896, 504, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render })

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

  game.load.image('earth', 'assets/images/light_sand.png')
  game.load.image('ui', 'assets/images/UI.png')

  game.load.spritesheet('playerbee', 'assets/images/bigbee.png', 64, 64)
}

var socket // Socket connection

var land

var player

var others
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
var playerGroup
var uiGroup

function create () {
  socket = io.connect()
  game.physics.startSystem(Phaser.Physics.ARCADE)
  // Resize our game world to be a 2000 x 2000 square
  game.world.setBounds(-512, -512, 1024, 1024)

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 896, 504, 'earth')
  land.fixedToCamera = true

  tileGroup = game.add.group();
  itemGroup = game.add.group();
  playerGroup = game.add.group();
  playerGroup.enableBody = true;
  uiGroup = game.add.group();
  uiGroup.fixedToCamera = true

  // The base of our player
  var startX = 0
  var startY = 0

  player = playerGroup.create(startX, startY, 'playerbee')
  player.body.drag = new Phaser.Point(600, 600)
  player.animations.add("fly", [0, 1], 10, true);
  player.animations.play("fly")
  //player = game.add.sprite(startX, startY, 'selected')
  // player.anchor.setTo(0.5, 0.5)

  // This will force it to decelerate and limit its speed
  // player.body.drag.setTo(200, 200)
  //player.body.maxVelocity.setTo(0, 0)
  //player.body.collideWorldBounds = true

  // cave, blender, packer, oven, moneybag
  tiles = {}
  items = {}

  others = []
  player.bringToTop()

  game.camera.follow(player)
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300)
  game.camera.focusOnXY(0, 0)

  uiGroup.create(UI_BACK_POS.x, UI_BACK_POS.y, 'ui')
  uiIcon = game.add.sprite(UI_ICON_POS.x, UI_ICON_POS.y, 'uparrow')
  uiGroup.add(uiIcon)
  uiText = game.add.text(UI_TEXT_POS.x, UI_TEXT_POS.y, "...", {font: 'Courier 10pt'})
  uiGroup.add(uiText)
  selectUIElement(0)

  setKeyCallbacks()
  // Start listening for events
  setEventHandlers()

  Kii.initializeWithSite("l1rxzy4xclvo", "f662ebb1125548bc84626f5264eb11b4", KiiSite.US)
}

function setKeyCallbacks () {
  cursors = game.input.keyboard.createCursorKeys()
  cursors.left.onDown.add(function () { movePlayer(-1, 0); keyCountdown = MAXKEYCOUNT }, this, 0)
  cursors.right.onDown.add(function () { movePlayer(1, 0); keyCountdown = MAXKEYCOUNT }, this, 0)
  cursors.up.onDown.add(function () { movePlayer(0, -1); keyCountdown = MAXKEYCOUNT }, this, 0)
  cursors.down.onDown.add(function () { movePlayer(0, 1); keyCountdown = MAXKEYCOUNT }, this, 0)

  game.input.keyboard.addKey(Phaser.Keyboard.Z).onDown.add(function () {
    selectUIElement(-1);
  });
  game.input.keyboard.addKey(Phaser.Keyboard.X).onDown.add(function () {
    selectUIElement(1);
  });
  game.input.keyboard.addKey(Phaser.Keyboard.C).onDown.add(function () {
    socket.emit('change tile',
        {tileId: tileDisplayOrder[selectedItemIndex],
        x: Math.round(player.x / 16),
        y: Math.round(player.y / 16)})
  });
}

var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected)

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect)

  // New player message received
  socket.on('new player', onNewPlayer)

  // Player move message received
  socket.on('move player', onMovePlayer)

  // Player removed message received
  socket.on('remove player', onRemovePlayer)

  // map was updated
  socket.on('update map', onMapUpdate)

  socket.on('update tile cost', onUpdateTileCost)

  // server side only
  //socket.on('change tile', onChangeTile)
}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y })
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id)

  // Add new player to the remote players array
  var remote = new RemotePlayer(data.id, game, playerGroup, player, data.x, data.y)
  others.push(remote)
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id)

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  // Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  playerGroup.remove(removePlayer.player)
  removePlayer.player.kill()

  // Remove player from array
  others.splice(others.indexOf(removePlayer), 1)
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

function getTileOrItem (tilesOrItems, x, y) {
  return tilesOrItems[x.toString() + ',' + y.toString]
}

function setTileOrItem (tilesOrItems, x, y, id) {
  tilesOrItems[x.toString() + ',' + y.toString] = id
}

function movePlayer (dx, dy) {
  player.x += dx * GRID_SIZE
  player.y += dy * GRID_SIZE
}

var MAXCOUNT = 20
var countdown = MAXCOUNT
var MAXKEYCOUNT = 8
var keyCountdown = MAXKEYCOUNT
function update () {
  //  only move when you click
  if (game.input.mousePointer.isDown)
  {
      //  400 is the speed it will move towards the mouse
      game.physics.arcade.moveToPointer(player, 400);

      //  if it's overlapping the mouse, don't move any more
      if (Phaser.Rectangle.contains(player.body, game.input.x, game.input.y))
      {
          player.body.velocity.setTo(0, 0);
      }
  }
  else
  {
      //player.body.velocity.setTo(0, 0);
  }

  keyCountdown--
  if (keyCountdown === 0) {
    if (cursors.left.isDown) {
      movePlayer(-1, 0)
    }
    if (cursors.right.isDown) {
      movePlayer(1, 0)
    }
    if (cursors.up.isDown) {
      movePlayer(0, -1)
    }
    if (cursors.down.isDown) {
      movePlayer(0, 1)
    }
    keyCountdown = MAXKEYCOUNT
  }

  for (var i = 0; i < others.length; i++) {
    others[i].update()
  }
  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y
  uiGroup.x = game.camera.x - UI_BACK_POS.x
  uiGroup.y = game.camera.y - UI_BACK_POS.y

  socket.emit('move player', { x: player.x, y: player.y })

  updateUI()

  countdown--
  if (countdown === 0) {
    countdown = MAXCOUNT
    socket.emit('query map', {})
  }
}

function render () {

}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < others.length; i++) {
    if (others[i].player.name === id) {
      return others[i]
    }
  }

  return false
}
