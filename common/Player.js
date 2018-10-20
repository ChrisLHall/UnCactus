;(function() {
  var Player = function (startX, startY, startPlayerID, startSocket) {
    this.x = startX;
    this.y = startY;
    this.angle = 0;
    this.playerID = startPlayerID;
    this.kiiObj = null;
    this.socket = startSocket;
    this.info = {};
  }

  Player.generateNewInfo = function (playerID) {
    return {
      powerup: {
        type: "none",
        expiresAt: 0
      },
      color: Math.floor(Math.random() * 3),
      inventory: [
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      playerID: playerID
    }
  }

  Player.firstEmptyInventorySlot = function (playerInfo) {
    for (var i = 0; i < playerInfo.inventory.length; i++) {
      if (null === playerInfo.inventory[i]) {
        return i;
      }
    }
    return -1;
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Player
  } else {
    window.Player = Player
  }
})();
