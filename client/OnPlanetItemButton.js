/* global game */

var OnPlanetItemButton = function (hostPlanetObj, placeIdx, group, itemType) {
    this.hostPlanetObj = hostPlanetObj
    this.placeIdx = placeIdx
    this.itemType = itemType
  
    this.gameObj = group.create(-10000, -10000, 'itemsUI')
    this.gameObj.anchor.setTo(0.5, 0.9)
    for (var i = 0; i <= 3; i++) {
      this.gameObj.animations.add(i.toString(), [i], 1, true)
    }
    this.gameObj.animations.play("0")
    this.gameObj.inputEnabled = true;
    this.gameObj.events.onInputDown.add(this.onClick, this);
    
    this.itemGameObj = group.create(-10000, -10000, 'items')
    this.itemGameObj.anchor.setTo(0.5, 0.9)
    for (var i = 0; i <= 3; i++) {
      this.itemGameObj.animations.add(i.toString(), [i], 1, true)
    }
    this.itemGameObj.animations.play("0")
    //this.gameObj.scale = new Phaser.Point(this.hostPlanetObj.info.size,
    //    this.hostPlanetObj.info.size)
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
  }
  
  window.OnPlanetItemButton = OnPlanetItemButton
  