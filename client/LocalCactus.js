/* global game */

var LocalCactus = function (hostPlanetObj, group, info) {

  this.planetID = planetID

  this.gameObj = group.create(info.x, info.y, 'planet')
  this.gameObj.anchor.setTo(0.5, 0.5)
  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClickListener, this);

  this.setInfo(info)
}

// TODO ACTUALLY FIGURE OUT WHAT NEEDS TO GO IN HERE @@@@@@@@@@@@@@@@@

// nobody's, mine, not mine
LocalCactus.colors = [0xbbbbbb, 0xddffdd, 0xbbeeff]
LocalCactus.prototype.setInfo = function (info) {
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
    this.gameObj.tint = LocalCactus.colors[colIdx]

    this.gameObj.scale = new Phaser.Point(info.size, info.size)
    this.gameObj.x = info.x
    this.gameObj.y = info.y
  }
}

LocalCactus.prototype.update = function () {
  this.gameObj.angle += this.info.rotSpeed
}

window.LocalPlanet = LocalPlanet
