/* global game */

var LocalPlot = function (hostPlanetObj, plotIdx, group, info) {
  this.hostPlanetObj = hostPlanetObj;
  this.plotIdx = plotIdx;
  this.group = group;
  this.type = "empty";
  this.currentFrame = 0;
  this.itemButton = null;
  this.arrowButton = null;
  this.emitterType = null;
  this.emitter = null;

  this.gameObj = group.create(-10000, -10000, 'empty')
  this.gameObj.anchor.setTo(0.5, 0.9)
  for (var i = 0; i <= 3; i++) {
    this.gameObj.animations.add(i.toString(), [i], 1, true)
  }
  this.gameObj.animations.play("0")
  this.setInfo(info)
}

LocalPlot.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Plot.generateNewInfo("empty", 0))
  this.info = info
  if (null != this.info) {
    var newType = this.info.type
    if (newType != this.type) {
      this.type = newType
      this.gameObj.loadTexture(this.type, 0);
    }
    // stop the particle emitter because it is almost guaranteed to be off-screen
    if (this.emitter) {
      this.emitter.destroy();
      this.emitter = null;
    }
    this.emitterType = null;
    
    this.updateAnim();

    var scaleFactor = 2;
    if (this.type === "beehive") {
      scaleFactor = 3;
    } else if (this.type === "emptybeehive") {
      scaleFactor = 2.5;
    }
    this.gameObj.scale = new Phaser.Point(this.hostPlanetObj.info.size * scaleFactor,
      this.hostPlanetObj.info.size * scaleFactor);
  }
}

LocalPlot.prototype.update = function () {
  var degs = this.hostPlanetObj.gameObj.angle + this.plotIdx * 60
  this.gameObj.angle = degs + 90
  var rads = degs * CommonUtil.DEG_TO_RAD
  var len = LocalPlanet.ORIG_RADIUS * this.hostPlanetObj.info.size
  this.gameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads);
  this.gameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads);
  if (this.emitter) {
    this.emitter.x = this.hostPlanetObj.gameObj.x + (len + 30) * Math.cos(rads);
    this.emitter.y = this.hostPlanetObj.gameObj.y + (len + 30) * Math.sin(rads);
  }

  this.updateButtons();
  this.updateParticles();
  this.updateAnim();
}

LocalPlot.prototype.updateButtons = function () {
  var ownedBySomeoneElse = (player && this.hostPlanetObj.info.owner && player.playerID !== this.hostPlanetObj.info.owner);
  var shouldHaveArrowButton = false;
  if (player && player.sittingOnPlanetID === this.hostPlanetObj.planetID && !ownedBySomeoneElse) {
    var pendingUseItem = player.info.inventory[player.selectedItemSlot];
    shouldHaveArrowButton = (pendingUseItem === "pollen" && this.info.type.startsWith("cactus") && this.currentFrame === 2 && !this.info.pollinatedType)
        || (pendingUseItem === "seed" && this.info.type === "empty")
        || (pendingUseItem === "nectar" && this.info.type === "beehive")
        || (pendingUseItem === "honeycomb" && this.info.type === "emptybeehive");
  }
  var shouldHaveItemButton = !shouldHaveArrowButton && !ownedBySomeoneElse && this.info.itemAvailable;
  var shouldHaveItemType = this.info.itemAvailable;
  // update buttons
  if (shouldHaveArrowButton && !this.arrowButton) {
    this.arrowButton = new OnPlanetSelectButton(this, this.plotIdx, this.group);
  }
  if (shouldHaveItemButton && !this.itemButton) {
    this.itemButton = new OnPlanetItemButton(this, this.plotIdx, this.group, "pollen");
  }
  
  if (!shouldHaveItemButton && this.itemButton) {
    this.itemButton.destroy();
    this.itemButton = null;
  }
  if (!shouldHaveArrowButton && this.arrowButton) {
    this.arrowButton.destroy();
    this.arrowButton = null;
  }

  if (this.itemButton) {
    this.itemButton.setItemType(shouldHaveItemType);
    this.itemButton.update();
  }
  if (this.arrowButton) {
    this.arrowButton.update();
  }

}

LocalPlot.prototype.updateParticles = function () {
  var shouldHaveEmitterType = null;
  if (this.info.pollinatedType) {
    shouldHaveEmitterType = "pollinated";
  } else if (this.info.type === "beehive") {
    shouldHaveEmitterType = "bees";
  }
  // TODO add the one for pollen
  if (shouldHaveEmitterType === "bees" && this.emitterType !== "bees") {
    this.emitterType = "bees";
    if (!this.emitter) {
      this.emitter = game.add.emitter(this.gameObj.x, this.gameObj.y, 10);
    }
    this.emitter.makeParticles("particles", 1);
    this.emitter.gravity = 0;
    this.emitter.start(false, 600, 200);
  } else if (shouldHaveEmitterType === "pollinated" && this.emitterType !== "pollinated") {
    this.emitterType = "pollinated";
    if (!this.emitter) {
      this.emitter = game.add.emitter(this.gameObj.x, this.gameObj.y, 10);
    }
    this.emitter.makeParticles("particles", 0);
    this.emitter.gravity = 0;
    this.emitter.start(false, 600, 1000);
  }
  if (this.emitterType && !shouldHaveEmitterType) {
    this.emitterType = null;
    if (this.emitter) {
      this.emitter.destroy();
      this.emitter = null;
    }
  }
}

LocalPlot.prototype.updateAnim = function () {
  if (null != this.info) {
    var age = Math.max(0, glob.currentServerTick - this.info.birthTick)
    var frame = 0
    for (var ageIdx = 0; ageIdx < Plot.GROWTH_AGES.length; ageIdx++) {
      if (age >= Plot.GROWTH_AGES[ageIdx]) {
        frame = ageIdx
      }
    }
    if (frame !== this.currentFrame) {
      this.currentFrame = frame;
      this.gameObj.animations.play(this.currentFrame.toString());
    }
  }
}

LocalPlot.prototype.destroy = function () {
  if (this.emitter) {
    this.emitter.destroy();
  }
  if (this.itemButton) {
    this.itemButton.destroy();
  }
  if (this.arrowButton) {
    this.arrowButton.destroy();
  }
  this.gameObj.destroy();
}

window.LocalPlot = LocalPlot