var ServerPlanet = function (startPlanetID) {
  var planetID = startPlanetID
  var info = {

  }

  // Define which variables and methods can be accessed
  return {
    planetID: planetID,
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
    size: 1.2,
    x: x,
    y: y,
    planetid: planetID
  }
}

module.exports = ServerPlanet
