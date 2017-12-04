var LocalPlayer = function (playerID, group, startX, startY) {
  var x = startX
  var y = startY

  this.playerID = playerID
  this.playerInfo = null

  this.gameObj = group.create(startX, startY, 'playerbee')
  this.gameObj.animations.add("fly", [0, 1], 10, true);
  this.gameObj.animations.play("fly")
  this.gameObj.anchor.setTo(0.5, 0.5)
  this.gameObj.bringToTop()
  glob.intermittents.push(new IntermittentUpdater(this, function (host) {
    socket.emit('move player', { x: host.targetPos.x, y: host.targetPos.y, angle: host.gameObj.angle })
  }, 30))

  this.gameObj.body.collideWorldBounds = true
  this.gameObj.body.immovable = true

  this.targetPos = new Phaser.Point(x, y)
  this.lerpSpeed = 5

  this.targetPlanetObj = null
  this.sittingOnPlanetObj = null
}

LocalPlayer.colors = [0xffffff, 0xaaffaa, 0xffccff]
LocalPlayer.prototype.setColorIndex = function (ind) {
  this.gameObj.tint = LocalPlayer.colors[ind];
}

LocalPlayer.prototype.setPlayerInfo = function (info) {
  this.playerInfo = info
  if (null != info) {
    this.setColorIndex(info.color)
  }
}

LocalPlayer.prototype.targetPlanet = function (planet) {
  if (null != planet) {
    this.targetPos = planet.gameObj.position
    this.targetPlanetObj = planet
  } else {
    this.targetPlanetObj = null
  }
}

LocalPlayer.prototype.exists = function () {
  return this.gameObj.exists
}

LocalPlayer.prototype.update = function () {
  //  only move when you click
  var clickPoint = new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY)
  if (!clickUsedByUI && game.input.activePointer.isDown
      && game.input.activePointer.duration > 50
      && Phaser.Point.subtract(clickPoint, this.gameObj.position)
      .getMagnitude() > 70) {
    //game.physics.arcade.moveToPointer(this.gameObj, 300);
    this.targetPos = clickPoint
    this.targetPlanet(null)
    this.sittingOnPlanetObj = null
  }

  var delta = Phaser.Point.subtract(this.targetPos, this.gameObj.position)
  if (delta.getMagnitude() > this.lerpSpeed) {
    delta.normalize()
    delta.multiply(this.lerpSpeed, this.lerpSpeed)
    this.gameObj.angle = Math.atan2(delta.y, delta.x) * Phaser.Math.RAD_TO_DEG
  } else {
    // arrived
    if (null != this.targetPlanetObj) {
      this.sittingOnPlanetObj = this.targetPlanetObj
      this.targetPlanet(null)
    }
  }
  this.gameObj.x += delta.x
  this.gameObj.y += delta.y

  if (null != this.sittingOnPlanetObj) {
    this.gameObj.angle += this.sittingOnPlanetObj.rotSpeed
  }
}

window.LocalPlayer = LocalPlayer
