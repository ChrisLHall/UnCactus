/* global game */

var OnPlanetItemButton = function (hostObj, placeIdx, group, itemType) {
  this.hostObj = hostObj;
  this.hostPlanetObj = this.hostObj.hostPlanetObj;
  this.placeIdx = placeIdx
  this.itemType = itemType

  this.buttonGameObj = group.create(-10000, -10000, 'itemsUI')
  this.buttonGameObj.anchor.setTo(0.5, 0.5)
  for (var i = 0; i <= 3; i++) {
    this.buttonGameObj.animations.add(i.toString(), [i], 1, true)
  }
  this.buttonGameObj.animations.play("1")
  this.buttonGameObj.inputEnabled = true;
  this.buttonGameObj.events.onInputDown.add(this.onClick, this);
  
  this.gameObj = group.create(-10000, -10000, 'items')
  this.gameObj.anchor.setTo(0.5, 0.5)
  Item.setupAnims(this.gameObj);
  this.gameObj.animations.play(this.itemType);
}
  
OnPlanetItemButton.prototype.update = function () {
  var degs = this.hostPlanetObj.gameObj.angle + this.placeIdx * 60;
  this.buttonGameObj.angle = degs + 90;
  var rads = degs * CommonUtil.DEG_TO_RAD;
  var len = LocalPlanet.ORIG_RADIUS * this.hostPlanetObj.info.size + OnPlanetItemButton.EXTRA_OFFSET;
  this.gameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads);
  this.gameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads);
  
  this.buttonGameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads);
  this.buttonGameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads);
}

OnPlanetItemButton.EXTRA_OFFSET = 100;

OnPlanetItemButton.prototype.onClick = function () {
  if (clickUsedByUI) {
    return;
  }
  clickUsedByUI = true;
  // TODO ROUTE THIS THROUGH THE SERVER
  console.log("clicked on planet button on " + this.hostPlanetObj.planetID);
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

OnPlanetItemButton.prototype.destroy = function () {
  this.gameObj.destroy();
  this.buttonGameObj.destroy();
}

window.OnPlanetItemButton = OnPlanetItemButton
  