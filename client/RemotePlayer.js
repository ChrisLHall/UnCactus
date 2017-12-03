/* global game */

var RemotePlayer = function (playerID, game, group, startX, startY) {
  var x = startX
  var y = startY

  this.playerID = playerID
  this.game = game
  this.health = 3

  this.player = group.create(x, y, 'playerbee')
  this.player.animations.add("fly", [0, 1], 10, true);
  this.player.animations.play("fly")
  //this.player = game.add.sprite(x, y, 'selected')

  console.log(this.player) // TODO REMOVE
  this.player.body.immovable = true
  this.player.body.collideWorldBounds = true

  this.lastPosition = { x: x, y: y }
}

RemotePlayer.prototype.update = function () {
  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
}

window.RemotePlayer = RemotePlayer
