/* global game */

var RemotePlayer = function (playerID, group, startX, startY) {
  var x = startX
  var y = startY

  this.playerID = playerID
  this.playerInfo = null

  this.gameObj = group.create(x, y, 'playerbee')
  this.gameObj.animations.add("fly", [0, 1], 10, true);
  this.gameObj.animations.play("fly")
  this.gameObj.anchor.setTo(0.5, 0.5)

  this.gameObj.body.immovable = true
  this.gameObj.body.collideWorldBounds = true

  this.targetPos = new Phaser.Point(x, y)
  this.lerpSpeed = 0
}

RemotePlayer.colors = [0xffffff, 0xddffdd, 0xffddff]
RemotePlayer.prototype.setColorIndex = function (ind) {
  this.gameObj.tint = RemotePlayer.colors[ind];
}

RemotePlayer.prototype.setPlayerInfo = function (info) {
  this.playerInfo = info
  if (null != info) {
    this.setColorIndex(info.color)
  }
}

RemotePlayer.prototype.exists = function () {
  return this.gameObj.exists
}

RemotePlayer.prototype.update = function () {
  var delta = Phaser.Point.subtract(this.targetPos, this.gameObj.position)
  if (delta.getMagnitude() > this.lerpSpeed) {
    delta.normalize()
    delta.multiply(this.lerpSpeed, this.lerpSpeed)
  }
  this.gameObj.x += delta.x
  this.gameObj.y += delta.y
}

RemotePlayer.prototype.setTargetPos = function(x, y) {
  this.targetPos.x = x
  this.targetPos.y = y

  this.lerpSpeed = Phaser.Point.subtract(this.gameObj.position, this.targetPos).getMagnitude() / 30
}

window.RemotePlayer = RemotePlayer
