/* global game */

var RemotePlayer = function (playerID, group, startX, startY, playerInfo) {
  var x = startX
  var y = startY

  this.playerID = playerID

  this.gameObj = group.create(x, y, 'playerbee')
  this.gameObj.animations.add("fly", [0, 1], 10, true);
  this.gameObj.animations.play("fly")
  this.gameObj.anchor.setTo(0.5, 0.5)

  this.gameObj.body.immovable = true
  this.gameObj.body.collideWorldBounds = true

  this.targetPos = new Phaser.Point(x, y)
  this.lerpSpeed = 6

  this.setInfo(playerInfo)
}

RemotePlayer.prototype.setColorIndex = function (ind) {
  
}

RemotePlayer.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Player.generateNewInfo(this.playerID))
  this.info = info
  if (null !== this.info) {
    this.gameObj.tint = LocalPlayer.colors[this.info.color];
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
  
  if (!CommonUtil.withinXY(this.gameObj, this.targetPos, 500, 500)) {
    this.gameObj.x = this.targetPos.x;
    this.gameObj.y = this.targetPos.y;
  } else {
    this.gameObj.x += delta.x;
    this.gameObj.y += delta.y;
  }
}

RemotePlayer.prototype.setTargetPos = function(x, y) {
  this.targetPos.x = x
  this.targetPos.y = y

  //this.lerpSpeed = Phaser.Point.subtract(this.gameObj.position, this.targetPos).getMagnitude() / 30
}

RemotePlayer.prototype.destroy = function () {
  this.gameObj.destroy();
}

window.RemotePlayer = RemotePlayer
