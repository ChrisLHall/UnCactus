/* global game */

var RemotePlayer = function (index, game, group, player, startX, startY) {
  var x = startX
  var y = startY

  this.game = game
  this.health = 3
  this.player = player

  this.player = group.create(x, y, 'selected')
  //this.player = game.add.sprite(x, y, 'selected')

  this.player.name = index.toString()
  this.player.body.immovable = true
  this.player.body.collideWorldBounds = true

  this.lastPosition = { x: x, y: y }
}

RemotePlayer.prototype.update = function () {
  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
}

window.RemotePlayer = RemotePlayer
