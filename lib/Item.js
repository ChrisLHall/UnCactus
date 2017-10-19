/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var Item = function (startX, startY, type) {
  var x = startX
  var y = startY
  var itemType = type
  var id

  // Getters and setters
  var getX = function () {
    return x
  }

  var getY = function () {
    return y
  }

  var setX = function (newX) {
    x = newX
  }

  var setY = function (newY) {
    y = newY
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    setX: setX,
    setY: setY,
    itemType: itemType,
    id: id
  }
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Item
