/* global game */

var LocalCactus = function (hostPlanetObj, slot, group, info) {
  this.hostPlanetObj = hostPlanetObj;
  this.slot = slot;
  this.group = group;
  this.type = "empty";
  this.currentFrame = 0;
  this.itemButton = null;

  this.gameObj = group.create(-10000, -10000, 'empty')
  this.gameObj.anchor.setTo(0.5, 0.9)
  for (var i = 0; i <= 3; i++) {
    this.gameObj.animations.add(i.toString(), [i], 1, true)
  }
  this.gameObj.animations.play("0")
  this.setInfo(info)
}

LocalCactus.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Cactus.generateNewInfo("empty", 0))
  this.info = info
  if (null != this.info) {
    var newType = this.info.type
    if (newType != this.type) {
      this.type = newType
      this.gameObj.loadTexture(this.type, 0);
    }
    this.updateAnim()

    // TODO CREATE THE UI BUTTON THING BASED ON THE SERVER
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    var scaleFactor = 2;
    if (this.type === "beehives") {
      scaleFactor = 3;
    }
    this.gameObj.scale = new Phaser.Point(this.hostPlanetObj.info.size * scaleFactor,
      this.hostPlanetObj.info.size * scaleFactor);
  }
}

LocalCactus.prototype.update = function () {
  var degs = this.hostPlanetObj.gameObj.angle + this.slot * 60
  this.gameObj.angle = degs + 90
  var rads = degs * CommonUtil.DEG_TO_RAD
  var len = LocalPlanet.ORIG_RADIUS * this.hostPlanetObj.info.size
  this.gameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads)
  this.gameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads)

  // update buttons
  // TODO MOVE THIS LOGIC ONTO THE SERVER PROBABLY
  if (this.info.itemAvailable && !this.itemButton) {
    this.itemButton = new OnPlanetItemButton(this, this.slot, this.group, "pollen");
  } else if (!this.info.itemAvailable && this.itemButton) {
    this.itemButton.destroy();
    this.itemButton = null;
  }

  if (this.itemButton) {
    this.itemButton.update();
  }

  this.updateAnim();
}

LocalCactus.prototype.updateAnim = function () {
  if (null != this.info) {
    var age = Math.max(0, glob.currentServerTick - this.info.birthTick)
    var frame = 0
    for (var ageIdx = 0; ageIdx < Cactus.GROWTH_AGES.length; ageIdx++) {
      if (age >= Cactus.GROWTH_AGES[ageIdx]) {
        frame = ageIdx
      }
    }
    if (frame !== this.currentFrame) {
      this.currentFrame = frame;
      this.gameObj.animations.play(this.currentFrame.toString());
    }
  }
}

window.LocalCactus = LocalCactus
