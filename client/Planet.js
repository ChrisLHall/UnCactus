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
  var colors = [0xddddff, 0xddffdd, 0xbbeeff]
  this.gameObj.tint = colors[Math.floor(Math.random() * colors.length)];
}

Planet.prototype.setPlanetInfo = function (info) {
  this.playerInfo = info
  if (null != info) {

  }
}

Planet.prototype.update = function () {
  this.gameObj.angle += this.rotSpeed
}

window.Planet = Planet
