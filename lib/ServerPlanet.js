var ServerPlanet = function (startPlanetID) {
  var planetID = startPlanetID
  var kiiObj = null
  var info = {

  }

  // Define which variables and methods can be accessed
  return {
    planetID: planetID,
    kiiObj: kiiObj,
    info: info,
  }
}

ServerPlanet.generateNewPlanetInfo = function(planetID, x, y, size, initialOwnerID) {
  return {
    owner: initialOwnerID,
    slots: [
      {
        type: "empty"
      },
      {
        type: "empty"
      },
      {
        type: "empty"
      },
      {
        type: "empty"
      },
      {
        type: "empty"
      },
      {
        type: "empty"
      }
    ],
    size: .3 + Math.random() * .2,
    x: x,
    y: y,
    planetid: planetID
  }
}

module.exports = ServerPlanet
