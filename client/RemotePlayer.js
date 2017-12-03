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
  this.player.anchor.setTo(0.5, 0.5)

  this.player.body.immovable = true
  this.player.body.collideWorldBounds = true

  this.targetPos = new Phaser.Point(x, y)
  this.lerpSpeed = 0
}

RemotePlayer.prototype.update = function () {
  var delta = Phaser.Point.subtract(this.targetPos, this.player.position)
  if (delta.getMagnitude() > this.lerpSpeed) {
    delta.normalize()
    delta.multiply(this.lerpSpeed, this.lerpSpeed)
  }
  this.player.x += delta.x
  this.player.y += delta.y
}

RemotePlayer.prototype.setTargetPos = function(x, y) {
  this.targetPos.x = x
  this.targetPos.y = y

  this.lerpSpeed = Phaser.Point.subtract(this.player.position, this.targetPos).getMagnitude() / 30
}

window.RemotePlayer = RemotePlayer
