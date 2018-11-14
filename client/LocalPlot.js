/* global game */

var LocalPlot = function (hostPlanetObj, plotIdx, group, info) {
  this.hostPlanetObj = hostPlanetObj;
  this.plotIdx = plotIdx;
  this.group = group;
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
  var oldInfo = this.info || {};
  this.info = info
  if (this.info) {
    if (oldInfo.type !== this.info.type || oldInfo.variant !== this.info.variant) {
      // variant comparison works even if they are undefined
      var texture = this.info.type;
      if (this.info.variant) {
        texture += "_" + this.info.variant;
      }
      this.gameObj.loadTexture(texture, 0);
    }
    // stop the particle emitter because it is almost guaranteed to be off-screen
    if (this.emitter) {
      this.emitter.destroy();
      this.emitter = null;
    }
    this.emitterType = null;

    this.updateAnim();

    var scaleFactor = 2;
    if (this.info.type === "beehive") {
      scaleFactor = 3;
    } else if (this.info.type === "emptybeehive") {
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
    shouldHaveArrowButton = (pendingUseItem.startsWith("pollen") && this.info.type === "cactus" && this.info.growState === 2 && !this.info.pollinatedType)
        || (pendingUseItem.startsWith("seed") && (this.info.type === "empty" || this.info.type === "cactus"))
        || (pendingUseItem.startsWith("nectar") && this.info.type === "beehive")
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
  if (this.info && this.info.hasOwnProperty("growState")) {
    if (this.info.growState !== this.currentFrame) {
      this.currentFrame = this.info.growState;
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
