/* global game */

var LocalCactus = function (hostPlanetObj, slot, group, info) {
  this.hostPlanetObj = hostPlanetObj;
  this.slot = slot;
  this.group = group;
  this.type = "empty";
  this.currentFrame = 0;
  this.itemButton = null;
  this.arrowButton = null;
  this.emitterType = null;
  this.emitter = game.add.emitter(-10000, -10000, 10);

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
    // stop the particle emitter because it is almost guaranteed to be off-screen
    this.emitter.kill();
    this.emitterType = null;
    
    this.updateAnim();

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
  this.emitter.x = this.hostPlanetObj.gameObj.x + (len + 30) * Math.cos(rads);
  this.emitter.y = this.hostPlanetObj.gameObj.y + (len + 30) * Math.sin(rads);

  // TODO IMPLEMENT THE ARROW BUTTONS GETTING CREATED / DESTROYED
  var shouldHaveArrowButton = false;
  if (player && player.sittingOnPlanetObj === this.hostPlanetObj) {
    var pendingUseItem = player.info.inventory[player.selectedItemSlot];
    shouldHaveArrowButton = (pendingUseItem === "pollen" && this.info.type.startsWith("cactus") && this.currentFrame === 2)
        || (pendingUseItem === "seed" && this.info.type === "empty");
  }
  var shouldHaveItemButton = !shouldHaveArrowButton && this.info.itemAvailable;
  var shouldHaveItemType = this.info.itemAvailable;
  // update buttons
  if (shouldHaveArrowButton && !this.arrowButton) {
    this.arrowButton = new OnPlanetSelectButton(this, this.slot, this.group);
  }
  if (shouldHaveItemButton && !this.itemButton) {
    this.itemButton = new OnPlanetItemButton(this, this.slot, this.group, "pollen");
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

  var shouldHaveEmitterType = null;
  if (this.info.pollinatedType) {
    shouldHaveEmitterType = "pollinated";
  } else if (this.info.type === "beehives") {
    shouldHaveEmitterType = "bees";
  }
  // TODO add the one for pollen
  if (shouldHaveEmitterType === "bees" && this.emitterType !== "bees") {
    this.emitterType = "bees";
    this.emitter.kill();
    this.emitter.makeParticles("particles", 1);
    this.emitter.gravity = 0;
    this.emitter.start(false, 600, 200);
  } else if (shouldHaveEmitterType === "pollinated" && this.emitterType !== "pollinated") {
    this.emitterType = "pollinated";
    this.emitter.kill();
    this.emitter.makeParticles("particles", 0);
    this.emitter.gravity = 0;
    this.emitter.start(false, 600, 1000);
  }
  if (this.emitterType && !shouldHaveEmitterType) {
    this.emitter.kill();
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
