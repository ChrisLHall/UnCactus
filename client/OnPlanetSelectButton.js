/* global game */

var OnPlanetSelectButton = function (hostObj, slot, group) {
  this.hostObj = hostObj;
  this.hostPlanetObj = this.hostObj.hostPlanetObj;
  this.slot = slot

  this.gameObj = group.create(-10000, -10000, 'itemsUI')
  this.gameObj.anchor.setTo(0.5, 0.5)
  for (var i = 0; i < 8; i++) {
    this.gameObj.animations.add(i.toString(), [i], 1, true)
  }
  this.gameObj.animations.play("3")
  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClick, this);
}
  
OnPlanetSelectButton.prototype.update = function () {
  var degs = this.hostPlanetObj.gameObj.angle + this.slot * 60;
  this.gameObj.angle = degs + 90;
  var rads = degs * CommonUtil.DEG_TO_RAD;
  var len = LocalPlanet.ORIG_RADIUS * this.hostPlanetObj.info.size + OnPlanetSelectButton.EXTRA_OFFSET;
  this.gameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads);
  this.gameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads);
}

OnPlanetSelectButton.EXTRA_OFFSET = 100;

OnPlanetSelectButton.prototype.onClick = function () {
  if (clickUsedByUI) {
    return;
  }
  clickUsedByUI = true;
  console.log("clicked on select button on " + this.hostPlanetObj.planetID);
  
  // so we wanna send a message to the server
  // with planet ID and slot number
  if (player && null !== player.selectedItemSlot) {
    socket.emit('use item', { slot: player.selectedItemSlot, targetPlanet: this.hostPlanetObj.planetID, targetSlot: this.slot });
    player.selectedItemSlot = null;
  }
}

OnPlanetSelectButton.prototype.destroy = function () {
  this.gameObj.destroy();
}

window.OnPlanetSelectButton = OnPlanetSelectButton
  