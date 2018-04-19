/* global game */

var LocalCactus = function (hostPlanetObj, placeIdx, group, info) {
  this.hostPlanetObj = hostPlanetObj
  this.placeIdx = placeIdx

  this.gameObj = group.create(-10000, -10000, 'cactus1')
  this.gameObj.anchor.setTo(0.5, 0.9)
  this.gameObj.animations.add("empty", [0], 1, true);
  for (var i = 0; i <= 2; i++) {
    this.gameObj.animations.add(i.toString(), [i + 1], 1, true)
  }
  this.gameObj.animations.play("empty")
  this.gameObj.scale = new Phaser.Point(this.hostPlanetObj.info.size,
      this.hostPlanetObj.info.size)
  this.setInfo(info)
}

LocalCactus.prototype.setInfo = function (info) {
  CommonUtil.validate(info, Cactus.generateNewInfo("empty"))
  this.info = info
  if (null != info) {
    var age = Math.max(0, glob.currentServerTick - info.birthTick)
    var frame = 0
    for (var ageIdx = 0; ageIdx < Cactus.GROWTH_AGES.length; ageIdx++) {
      if (age >= Cactus.GROWTH_AGES[ageIdx]) {
        frame = ageIdx
      }
    }
    this.gameObj.animations.play(frame.toString())
  }
}

LocalCactus.prototype.update = function () {
  var degs = this.hostPlanetObj.gameObj.angle + this.placeIdx * 60
  this.gameObj.angle = degs + 90
  var rads = degs * CommonUtil.DEG_TO_RAD
  var len = LocalPlanet.ORIG_RADIUS * this.hostPlanetObj.info.size
  this.gameObj.x = this.hostPlanetObj.gameObj.x + len * Math.cos(rads)
  this.gameObj.y = this.hostPlanetObj.gameObj.y + len * Math.sin(rads)
}

window.LocalPlanet = LocalPlanet
