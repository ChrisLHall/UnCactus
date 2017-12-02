/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var ServerPlayer = function (startX, startY) {
  var x = startX
  var y = startY
  var vx = 0
  var vy = 0
  var angle = 0
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

  var getVX = function () {
    return vx
  }

  var getVY = function () {
    return vy
  }

  var setVX = function (newVX) {
    vx = newVX
  }

  var setVY = function (newVY) {
    vy = newVY
  }

  var getAngle = function () {
    return angle
  }

  var setAngle = function (newAngle) {
    angle = newAngle
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    setX: setX,
    setY: setY,
    getVX: getVX,
    getVY: getVY,
    setVX: setVX,
    setVY: setVY,
    getAngle: getAngle,
    setAngle: setAngle,
    id: id
  }
}

module.exports = ServerPlayer
