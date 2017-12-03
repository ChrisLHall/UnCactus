/* global game */

var Planet = function (planetID, game, group, startX, startY, size) {
  var x = startX
  var y = startY

  this.planetID = planetID
  this.game = game

  this.planet = group.create(x, y, 'planet')
  this.planet.anchor.setTo(0.5, 0.5)

  this.rotSpeed = -.15 + Math.random() * .3
  this.planet.scale = new Phaser.Point(size, size)
  var colors = [0xddddff, 0xddffdd, 0xbbeeff]
  this.planet.tint = colors[Math.floor(Math.random() * colors.length)];
}

Planet.prototype.update = function () {
  this.planet.angle += this.rotSpeed
}

window.Planet = Planet
