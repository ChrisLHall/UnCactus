/* global game */

var Planet = function (planetID, group, startX, startY, size) {
  var x = startX
  var y = startY

  this.planetID = planetID
  this.planetInfo = null

  this.gameObj = group.create(x, y, 'planet')
  this.gameObj.anchor.setTo(0.5, 0.5)

  this.rotSpeed = -.15 + Math.random() * .3
  this.gameObj.scale = new Phaser.Point(size, size)
  this.gameObj.tint = Planet.colors[0];

  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClickListener, this);
}

// nobody's, mine, not mine
Planet.colors = [0xbbbbbb, 0xddffdd, 0xbbeeff]
Planet.prototype.setPlanetInfo = function (info) {
  this.playerInfo = info
  if (null != info) {
    var ownerID = info.owner
    var colIdx = 0
    if (null == ownerID || "" === ownerID) {
      colIdx = 0
    } else if (null != player && ownerID === player.playerID) {
      colIdx = 1
    } else {
      colIdx = 2
    }
    this.gameObj.tint = Planet.colors[colIdx]

    this.gameObj.scale = new Phaser.Point(info.size, info.size)
    this.gameObj.x = info.x
    this.gameObj.y = info.y
  }
}

Planet.prototype.onClickListener = function () {
  clickUsedByUI = true // ALWAYS DO THIS FIRST
  if (null != player) {
    player.targetPlanet(this)
  }
}

Planet.prototype.update = function () {
  this.gameObj.angle += this.rotSpeed
}

window.Planet = Planet
