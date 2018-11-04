var HomeUIButton = function (group, homeIdx, screenX, screenY) {
  this.group = group;
  this.homeIdx = homeIdx;

  this.button = new UIButton(group, "gohome", 0, screenX, screenY, this.onClick);
  this.button.homeUIButton = this; // gotta have a reference to this
  this.button.gameObj.animations.play("0")
  this.deleteButton = new UIButton(group, "itemsUI", 4, screenX, screenY + 70, this.onClickDelete);
  this.deleteButton.homeUIButton = this;

  this.updateGFX();
}

HomeUIButton.prototype.updateGFX = function () {
  if (!player) {
    return;
  }
  var homePlanets = findHomePlanets(player.playerID);
  var available = homePlanets.length > this.homeIdx;
  var moreThan1 = homePlanets.length > 1;
  var sittingOn = available && player.sittingOnPlanetObj === homePlanets[this.homeIdx];
  this.button.gameObj.alpha = available ? 1 : .5;
  if (sittingOn) {
    this.button.gameObj.tint = 0xdfffdf;
  } else {
    this.button.gameObj.tint = 0xffffff;
  }
  this.deleteButton.gameObj.visible = moreThan1 && available && sittingOn;
}

HomeUIButton.prototype.onClick = function(pointer) {
  // 'this' in this context is the UIButton...i know...dumb
  if (!player) {
    return;
  }

  var homePlanets = findHomePlanets(player.playerID);
  var available = homePlanets.length > this.homeUIButton.homeIdx;
  if (available) {
      player.teleportToPlanet(homePlanets[this.homeUIButton.homeIdx]);
  }
}

HomeUIButton.prototype.onClickDelete = function(pointer) {
  // 'this' in this context is the UIButton
  if (!player) {
    return;
  }

  var homePlanets = findHomePlanets(player.playerID);
  var available = homePlanets.length > this.homeUIButton.homeIdx;
  var moreThan1 = homePlanets.length > 1;
  var sittingOn = available && player.sittingOnPlanetObj === homePlanets[this.homeUIButton.homeIdx];

  if (available && moreThan1 && sittingOn) {
    socket.emit('destroy beehive', {targetPlanet: homePlanets[this.homeUIButton.homeIdx]});
  }
}
