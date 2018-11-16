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
      color: Math.floor(Math.random() * 6),
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

  Player.hasInInventory = function (playerInfo, item) {
    for (var i = 0; i < playerInfo.inventory.length; i++) {
      if (item === playerInfo.inventory[i]) {
        return true;
      }
    }
    return false;
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Player
  } else {
    window.Player = Player
  }
})();
