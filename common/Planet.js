;(function() {
  var Planet = function (startPlanetID) {
    this.planetID = startPlanetID
    this.kiiObj = null
    this.info = {}
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
      planetID: planetID
    }
  }

  Planet.planetListToInfoList = function (planetList) {
    var result = []
    for (var i = 0; i < planetList.length; i++) {
      result.push(planetList[i].info)
    }
    return result
  }

  Planet.findSlotOfType = function (planetSlots, type) {
    for (var i = 0; i < planetSlots.length; i++) {
      if (planetSlots[i].type === type) {
        return i;
      }
    }
    return null;
  }

  Planet.generateCactusInfo = function (type, birthTick) { }; // Always re-assign this function to Cactus.generateNewInfo

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Planet
  } else {
    window.Planet = Planet
  }
})();
