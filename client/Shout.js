/* global game */

var Shout = function (playerID) {
  this.playerObj = playerByID(playerID)
  if (!this.playerObj) {
    this.playerObj = player
  }

  this.gameObj = game.add.sprite(-4000, -4000, 'shout')
  this.gameObj.bringToTop()
  this.counter = 150
  this.gameObj.anchor.setTo(0.5, 2)
  this.gameObj.inputEnabled = true;
  this.gameObj.events.onInputDown.add(this.onClick, this);
}


Shout.prototype.update = function () {
  if (null != this.playerObj) {
    this.gameObj.position.x = this.playerObj.gameObj.position.x
    this.gameObj.position.y = this.playerObj.gameObj.position.y
    this.gameObj.position.clampX(game.camera.x + 50, game.camera.x + game.camera.width - 100)
    // offset this toward the bottom slightly
    this.gameObj.position.clampY(game.camera.y + 300, game.camera.y + game.camera.height - 100)
  }
  this.counter--
  if (this.counter == 0) {
    if (glob.shouts.indexOf(this) >= 0) {
      glob.shouts.splice(glob.shouts.indexOf(this), 1)
    }
    this.destroy();
  }
}

Shout.prototype.onClick = function () {
  if (clickUsedByUI) {
    return;
  }
  clickUsedByUI = true;

  if (player && this.playerObj) {
    var deltaX = -50 + 100 * Math.random();
    var deltaY = -50 + 100 * Math.random();
    player.teleportToPosition(this.playerObj.gameObj.x + deltaX, this.playerObj.gameObj.y + deltaY);
    console.log("Teleported!");
  }
}

Shout.prototype.destroy = function () {
  this.gameObj.destroy();
  this.playerObj = null;
}

window.Shout = Shout
