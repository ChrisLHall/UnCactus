var LocalPlayer = function (playerID, group, startX, startY) {
  var x = startX
  var y = startY

  this.playerID = playerID
  this.playerInfo = null

  this.gameObj = group.create(startX, startY, 'playerbee')
  this.gameObj.body.drag = new Phaser.Point(600, 600)
  this.gameObj.animations.add("fly", [0, 1], 10, true);
  this.gameObj.animations.play("fly")
  this.gameObj.anchor.setTo(0.5, 0.5)
  this.gameObj.bringToTop()
  glob.intermittents.push(new IntermittentUpdater(this, function (host) {
    socket.emit('move player', { x: host.gameObj.x, y: host.gameObj.y, vx: host.gameObj.body.velocity.x, vy: host.gameObj.body.velocity.y, angle: host.gameObj.angle })
  }, 30))

  this.gameObj.body.collideWorldBounds = true
}

LocalPlayer.colors = [0xffffff, 0xddffdd, 0xffddff]
LocalPlayer.prototype.setColorIndex = function (ind) {
  this.gameObj.tint = LocalPlayer.colors[ind];
}

LocalPlayer.prototype.setPlayerInfo = function (info) {
  this.playerInfo = info
  if (null != info) {
    this.setColorIndex(info.color)
  }
}

LocalPlayer.prototype.exists = function () {
  return this.gameObj.exists
}

LocalPlayer.prototype.update = function () {
  //  only move when you click
  if (game.input.activePointer.isDown
      && Phaser.Point.subtract(
      new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY), this.gameObj.position)
      .getMagnitude() > 70) {
    game.physics.arcade.moveToPointer(this.gameObj, 300);
    this.gameObj.angle = this.gameObj.body.angle * Phaser.Math.RAD_TO_DEG
  }
}

window.LocalPlayer = LocalPlayer
