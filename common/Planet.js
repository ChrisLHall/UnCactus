;(function() {
  // Imports
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    Plot = require("./Plot");
    CommonUtil = require("./CommonUtil");
  }
  
  var Planet = function (startPlanetID) {
    this.planetID = startPlanetID
    this.kiiObj = null
    this.info = {}
    this.changed = false;
  }

  Planet.generateNewInfo = function(planetID, x, y, initialOwnerID) {
    return {
      owner: initialOwnerID,
      plots: Planet.generatePlotInfo(6),
      size: .3 + Math.random() * .2,
      rotSpeed: (.05 + Math.random() * .10) * (Math.random() > .5 ? 1 : -1),
      x: x,
      y: y,
      planetID: planetID
    }
  }

  Planet.validateInfo = function (planetInfo) {
    // Rename variables that may have changed, etc
    // TODO remove once fixed
    if (planetInfo.slots) {
      planetInfo.plots = planetInfo.slots;
      delete planetInfo.slots;
    }

    newPlanetInfo = Planet.generateNewInfo(planetInfo.planetID, planetInfo.x, planetInfo.y, planetInfo.owner);
    CommonUtil.transferCommonProps(newPlanetInfo, planetInfo);
    for (var i = 0; i < newPlanetInfo.plots.length; i++) {
      newPlanetInfo.plots[i] = Plot.validateInfo(newPlanetInfo.plots[i]);
    }
    return newPlanetInfo
  }

  Planet.planetListToInfoList = function (planetList) {
    var result = []
    for (var i = 0; i < planetList.length; i++) {
      result.push(planetList[i].info)
    }
    return result
  }

  Planet.findPlotOfType = function (planetSlots, type) {
    for (var i = 0; i < planetSlots.length; i++) {
      if (planetSlots[i].type === type) {
        return i;
      }
    }
    return null;
  }

  Planet.generatePlotInfo = function (num) {
    var result = [];
    for (var i = 0; i < num; i++) {
      result.push(Plot.generateNewInfo("empty", 0));
    }
    return result;
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Planet
  } else {
    window.Planet = Planet
  }
})();
