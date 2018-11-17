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

  this.targetPlanetID = null;
  this.sittingOnPlanetID = null;

  // Item slot we're about to use
  this.selectedItemSlot = null;

  this.setInfo(playerInfo)
}

LocalPlayer.colors = [0xffffff, 0x7fff7f, 0xff9fff, 0x6f9fff, 0xff9f2f, 0x0f0f9f];
LocalPlayer.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Player.generateNewInfo(this.playerID))
  this.info = info
  if (null !== this.info) {
    this.updateInventoryGFX();
    this.gameObj.tint = LocalPlayer.colors[this.info.color];
  }
}

LocalPlayer.prototype.updateInventoryGFX = function () {
  for (var i = 0; i < itemUIButtons.length; i++) {
    itemUIButtons[i].updateGFX();
  }
}

LocalPlayer.prototype.targetPlanet = function (planetID) {
  if (planetID/* && this.flightTimeLeft > 0 */) {
    this.sittingOnPlanetID = null;
    var planet = planetByID(planetID);
    if (planet) {
      this.targetPos = new Phaser.Point(planet.x, planet.y);
      this.targetPlanetID = planetID
    }
  } else {
    this.targetPlanetID = null
  }
}

LocalPlayer.prototype.teleportToPlanet = function (planetID) {
  var planetInfo = planetByID(planetID);
  if (planetInfo) {
    var pos = new Phaser.Point(planetInfo.x, planetInfo.y);
    this.gameObj.position = pos;
    this.targetPos = pos.clone();
    this.targetPlanetID = planetID;
  }
  updateSpawnedObjs();
}

LocalPlayer.prototype.teleportToPosition = function (x, y) {
  this.sittingOnPlanetID = null;
  this.targetPlanet(null);
  this.gameObj.x = x;
  this.gameObj.y = y;
  this.targetPos = new Phaser.Point(x, y);
  updateSpawnedObjs();
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
  return this.info.inventory[this.selectedItemSlot];
}

LocalPlayer.prototype.exists = function () {
  return this.gameObj.exists
}

LocalPlayer.prototype.update = function () {
  //  only move when you click
  var clickPoint = new Phaser.Point(game.input.activePointer.worldX, game.input.activePointer.worldY)
  if (!clickUsedByUI /*&& this.flightTimeLeft > 0*/ && game.input.activePointer.isDown
      && game.input.activePointer.duration > 50
      && Phaser.Point.subtract(clickPoint, this.gameObj.position)
      .getMagnitude() > 70) {
    //game.physics.arcade.moveToPointer(this.gameObj, 300);
    this.targetPos = clickPoint
    this.targetPlanet(null)
    this.sittingOnPlanetID = null
  }

  var delta = Phaser.Point.subtract(this.targetPos, this.gameObj.position)
  var speed = LocalPlayer.BASE_SPEED * this.speedMultiplier();
  if (this.flightTimeLeft <= 0) {
    speed = 1; // very slow
  }
  if (delta.getMagnitude() > speed) {
    delta.normalize()
    delta.multiply(speed, speed)
    this.gameObj.angle = Math.atan2(delta.y, delta.x) * Phaser.Math.RAD_TO_DEG
  } else {
    // arrived
    if (null !== this.targetPlanetID) {
      this.sittingOnPlanetID = this.targetPlanetID
      this.targetPlanet(null)
    }
  }
  this.gameObj.x += delta.x
  this.gameObj.y += delta.y

  if (Math.abs(delta.x) + Math.abs(delta.y) > 1 && this.flightTimeLeft > 0) {
    this.flightTimeLeft -= this.speedMultiplier();
  }

  if (null !== this.sittingOnPlanetID) {
    var planetInfo = planetByID(this.sittingOnPlanetID);
    if (planetInfo) {
      this.gameObj.angle += planetInfo.rotSpeed
      if (this.flightTimeLeft < MAX_ENERGY) {
        // maybe certain planets recharge you?
        var rechargeSpeed = 0;
        if (planetInfo.owner === this.playerID) {
          rechargeSpeed = 5;
        }
        this.flightTimeLeft = Math.min(this.flightTimeLeft + rechargeSpeed, MAX_ENERGY);
      }
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

LocalPlayer.prototype.destroy = function () {
  this.gameObj.destroy();
}

window.LocalPlayer = LocalPlayer
