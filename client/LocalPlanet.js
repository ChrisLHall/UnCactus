/* global game */

var LocalPlanet = function (planetID, group, info) {

  this.planetID = planetID

  this.gameObj = group.create(info.x, info.y, 'planet')
  this.gameObj.anchor.setTo(0.5, 0.5)
  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClickListener, this);

  this.setInfo(info)

  this.inhabitants = []
  for (var i = 0; i < 6; i++) {
    var plot = new LocalPlot(this, i, group, info.plots[i])
    this.inhabitants.push(plot)
  }
}

// nobody's, mine, not mine
LocalPlanet.colors = [0xbbbbbb, 0xddffdd, 0xbbeeff]
LocalPlanet.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Planet.generateNewInfo(this.planetID, 0, 0, null))
  this.info = info
  if (this.info) {
    var ownerID = this.info.owner
    var colIdx = 0
    if (!ownerID) {
      colIdx = 0
    } else if (null != player && ownerID === player.playerID) {
      colIdx = 1
    } else {
      colIdx = 2
    }
    this.gameObj.tint = LocalPlanet.colors[colIdx]

    this.gameObj.scale = new Phaser.Point(this.info.size * 2, this.info.size * 2)
    this.gameObj.x = this.info.x
    this.gameObj.y = this.info.y

    if (this.inhabitants) {
      for (var i = 0; i < 6; i++) {
        this.inhabitants[i].setInfo(this.info.plots[i])
      }
    }
  }
}

LocalPlanet.prototype.onClickListener = function () {
  clickUsedByUI = true // ALWAYS DO THIS FIRST
  if (null != player) {
    player.targetPlanet(this.planetID)
  }
}

LocalPlanet.prototype.update = function () {
  this.gameObj.angle += this.info.rotSpeed

  for (var i = 0; i < this.inhabitants.length; i++) {
    this.inhabitants[i].update()
  }
}

LocalPlanet.prototype.destroy = function () {
  for (var i = 0; i < this.inhabitants.length; i++) {
    this.inhabitants[i].destroy();
  }
  this.gameObj.destroy();
}

LocalPlanet.ORIG_RADIUS = 115 * 2

window.LocalPlanet = LocalPlanet
