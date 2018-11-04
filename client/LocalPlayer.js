var LocalPlayer = function (playerID, group, startX, startY, playerInfo) {
  this.playerID = playerID;

  this.gameObj = group.create(startX, startY, 'playerbee')
  this.gameObj.animations.add("fly", [0, 1], 10, true);
  this.gameObj.animations.play("fly")
  this.gameObj.anchor.setTo(0.5, 0.5)
  this.gameObj.bringToTop()
  glob.intermittents.push(new IntermittentUpdater(this, function () {
    socket.emit('move player', { x: this.targetPos.x, y: this.targetPos.y, angle: this.gameObj.angle })
  }, 30))

  this.gameObj.body.collideWorldBounds = true
  this.gameObj.body.immovable = true

  this.targetPos = new Phaser.Point(startX, startY)
  this.lerpSpeed = 5
  this.flightTimeLeft = MAX_ENERGY;

  this.targetPlanetObj = null;
  this.sittingOnPlanetObj = null;

  // Item slot we're about to use
  this.selectedItemSlot = null;

  this.setInfo(playerInfo)
}

LocalPlayer.colors = [0xffffff, 0xaaffaa, 0xffccff]
LocalPlayer.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Player.generateNewInfo(this.playerID))
  this.info = info
  if (null != this.info) {
    this.updateInventoryGFX();
    this.gameObj.tint = LocalPlayer.colors[this.info.color];
  }
}

LocalPlayer.prototype.updateInventoryGFX = function () {
  for (var i = 0; i < itemUIButtons.length; i++) {
    itemUIButtons[i].updateGFX();
  }
}

LocalPlayer.prototype.targetPlanet = function (planet) {
  if (planet && this.flightTimeLeft > 0) {
    this.sittingOnPlanetObj = null;
    this.targetPos = planet.gameObj.position
    this.targetPlanetObj = planet
  } else {
    this.targetPlanetObj = null
  }
}

LocalPlayer.prototype.teleportToPlanet = function (planet) {
  var pos = planet.gameObj.position.clone()
  this.gameObj.position = pos
  this.targetPos = pos
  this.targetPlanetObj = planet
}

LocalPlayer.prototype.itemRequiresTarget = function (slot) {
  if (null === slot) {
    return false;
  }
  var item = this.info.inventory[slot];
  if (!item) {
    return false;
  }

  return Item.requiresTarget(item);
}

LocalPlayer.prototype.currentSelectedItem = function () {
  if (null === this.selectedItemSlot) {
    return null;
  }
  return this.info.inventory(this.selectedItemSlot);
}

LocalPlayer.prototype.exists = function () {
  return this.gameObj.exists
}

LocalPlayer.prototype.update = function () {
  //  only move when you click
  var clickPoint = new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY)
  if (!clickUsedByUI && this.flightTimeLeft > 0 && game.input.activePointer.isDown
      && game.input.activePointer.duration > 50
      && Phaser.Point.subtract(clickPoint, this.gameObj.position)
      .getMagnitude() > 70) {
    //game.physics.arcade.moveToPointer(this.gameObj, 300);
    this.targetPos = clickPoint
    this.targetPlanet(null)
    this.sittingOnPlanetObj = null
  }

  var delta = Phaser.Point.subtract(this.targetPos, this.gameObj.position)
  var speed = LocalPlayer.BASE_SPEED * this.speedMultiplier();
  if (delta.getMagnitude() > speed) {
    delta.normalize()
    delta.multiply(speed, speed)
    this.gameObj.angle = Math.atan2(delta.y, delta.x) * Phaser.Math.RAD_TO_DEG
  } else {
    // arrived
    if (null !== this.targetPlanetObj) {
      this.sittingOnPlanetObj = this.targetPlanetObj
      this.targetPlanet(null)
    }
  }
  this.gameObj.x += delta.x
  this.gameObj.y += delta.y

  if (Math.abs(delta.x) + Math.abs(delta.y) > 1 && this.flightTimeLeft > 0) {
    this.flightTimeLeft -= this.speedMultiplier();
  }

  if (null !== this.sittingOnPlanetObj) {
    this.gameObj.angle += this.sittingOnPlanetObj.info.rotSpeed
    if (this.sittingOnPlanetObj.info.owner === this.playerID && this.flightTimeLeft < MAX_ENERGY) {
      this.flightTimeLeft = Math.min(this.flightTimeLeft + 5, MAX_ENERGY);
    }
  } else {
    // cannot select items for use if you are flying around
    this.selectedItemSlot = null;
  }
  if (null !== this.selectedItemSlot && !this.info.inventory[this.selectedItemSlot]) {
    this.selectedItemSlot = null;
  }
}

LocalPlayer.BASE_SPEED = 3;

LocalPlayer.prototype.speedMultiplier = function () {
  return CommonUtil.clamp(Math.ceil(this.flightTimeLeft / MAX_ENERGY), 1, 3);
}

window.LocalPlayer = LocalPlayer
