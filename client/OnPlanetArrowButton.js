/* global game */

var OnPlanetSelectButton = function (hostObj, placeIdx, group, itemType) {
  this.hostObj = hostObj;
  this.hostPlanetObj = this.hostObj.hostPlanetObj;
  this.placeIdx = placeIdx

  this.gameObj = group.create(-10000, -10000, 'itemsUI')
  this.gameObj.anchor.setTo(0.5, 0.5)
  for (var i = 0; i <= 3; i++) {
    this.gameObj.animations.add(i.toString(), [i], 1, true)
  }
  this.gameObj.animations.play("3")
  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClick, this);
}
  
OnPlanetSelectButton.prototype.update = function () {
  var degs = this.hostPlanetObj.gameObj.angle + this.placeIdx * 60;
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
  // TODO ROUTE THIS THROUGH THE SERVER
  console.log("clicked on select button on " + this.hostPlanetObj.planetID);
  /*if (player) {
    if (player.tryAddItem(this.itemType)) {
      this.destroy();
      this.hostObj.itemButton = null;
    }
  }*/
  // so we wanna send a message to the server
  // with planet ID and slot number
  if (player) {
    socket.emit("collect item", { planetID: this.hostPlanetObj.planetID, slot: this.hostObj.slot })
  }
}

OnPlanetSelectButton.prototype.destroy = function () {
  this.gameObj.destroy();
}

window.OnPlanetSelectButton = OnPlanetSelectButton
  