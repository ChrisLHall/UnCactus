;(function() {
  var Planet = function (startPlanetID) {
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

  Planet.generateNewInfo = function(planetID, x, y, initialOwnerID) {
    return {
      owner: initialOwnerID,
      slots: [
        Planet.generateCactusInfo("empty", 0),
        Planet.generateCactusInfo("empty", 0),
        Planet.generateCactusInfo("empty", 0),
        Planet.generateCactusInfo("empty", 0),
        Planet.generateCactusInfo("empty", 0),
        Planet.generateCactusInfo("empty", 0),
      ],
      size: .3 + Math.random() * .2,
      rotSpeed: (.05 + Math.random() * .10) * (Math.random() > .5 ? 1 : -1),
      x: x,
      y: y,
      planetid: planetID
    }
  }

  Planet.generateCactusInfo = function () {} // assign this

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Planet
  } else {
    window.Planet = Planet
  }
})();
