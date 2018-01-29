/* global game */

var LocalPlanet = function (planetID, group, info) {

  this.planetID = planetID

  this.gameObj = group.create(info.x, info.y, 'planet')
  this.gameObj.anchor.setTo(0.5, 0.5)
  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClickListener, this);

  this.setInfo(info)

  this.inhabitants = []
  // TODO TESTING cacti
  for (var i = 0; i < 6; i++) {
    var cactus = new LocalCactus(this, i, group, {type:"empty"})
    this.inhabitants.push(cactus)
  }
}

// nobody's, mine, not mine
LocalPlanet.colors = [0xbbbbbb, 0xddffdd, 0xbbeeff]
LocalPlanet.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Planet.generateNewInfo(this.planetID, 0, 0, ""))
  this.info = info
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
    this.gameObj.tint = LocalPlanet.colors[colIdx]

    this.gameObj.scale = new Phaser.Point(info.size, info.size)
    this.gameObj.x = info.x
    this.gameObj.y = info.y
  }
}

LocalPlanet.prototype.onClickListener = function () {
  clickUsedByUI = true // ALWAYS DO THIS FIRST
  if (null != player) {
    player.targetPlanet(this)
  }
}

LocalPlanet.prototype.update = function () {
  this.gameObj.angle += this.info.rotSpeed

  for (var i = 0; i < this.inhabitants.length; i++) {
    this.inhabitants[i].update()
  }
}

LocalPlanet.ORIG_RADIUS = 115

window.LocalPlanet = LocalPlanet
