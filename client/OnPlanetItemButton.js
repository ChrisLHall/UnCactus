/* global game */

var OnPlanetItemButton = function (hostPlanetObj, placeIdx, group, itemType) {
    this.hostPlanetObj = hostPlanetObj
    this.placeIdx = placeIdx
    this.itemType = itemType
  
    this.buttonGameObj = group.create(-10000, -10000, 'itemsUI')
    this.buttonGameObj.anchor.setTo(0.5, 0.9)
    for (var i = 0; i <= 3; i++) {
      this.buttonGameObj.animations.add(i.toString(), [i], 1, true)
    }
    this.buttonGameObj.animations.play("0")
    this.buttonGameObj.inputEnabled = true;
    this.buttonGameObj.events.onInputDown.add(this.onClick, this);
    
    this.gameObj = group.create(-10000, -10000, 'items')
    this.gameObj.anchor.setTo(0.5, 0.9)
    Item.setupAnims(this.gameObj);
  }
  
  OnPlanetItemButton.prototype.update = function () {
    var degs = this.hostPlanetObj.gameObj.angle + this.placeIdx * 60
    this.gameObj.angle = degs + 90
    var rads = degs * CommonUtil.DEG_TO_RAD
    var len = LocalPlanet.ORIG_RADIUS * this.hostPlanetObj.info.size
    this.gameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads)
    this.gameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads)
    
    this.itemGameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads)
    this.itemGameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads)
    
    this.updateAnim()
  }
  
  OnPlanetItemButton.prototype.onClick = function () {
    if (clickUsedByUI) {
      return;
    }
    clickUsedByUI = true;
    // TODO IMPLEMENT FUNCTIONALITY
    console.log("clicked on planet button on " + this.hostPlanetObj.planetID);
  }
  
  window.OnPlanetItemButton = OnPlanetItemButton
  