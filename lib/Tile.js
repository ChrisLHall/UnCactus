/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var Tile = function (startX, startY, type) {
  var x = startX
  var y = startY
  var tileType = type
  var id

  // Define which variables and methods can be accessed
  return {
    x: x,
    y: y,
    tileType: tileType,
    id: id
  }
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Tile
