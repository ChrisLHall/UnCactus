;(function() {
  // Imports
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    CommonUtil = require("./CommonUtil");
  }
  var Plot = function (startType, birthTick) {
    this.info = Plot.generateNewInfo(startType, birthTick);
  }

  Plot.generateNewInfo = function(type, birthTick, existingObj) {
    // does not modify existingObj
    var newObj = {}
    CommonUtil.validate(newObj, Plot.globalTemplate);
    // TODO HANDLE TYPES WHICH ARE PARTIAL NAMES
    // like cactus1. Maybe use underscores in these names?
    // because otherwise emptybeehive starts with empty, and
    // it gets jacked up
    if (Plot.typeTemplates.hasOwnProperty(type)) {
      CommonUtil.validate(newObj, Plot.typeTemplates[type]);
    }
    if (existingObj) {
      CommonUtil.transferCommonProps(newObj, existingObj);
    }
    // now apply new information
    newObj.type = type;
    newObj.birthTick = birthTick;
    return newObj
  }

  // when the data format changes, make sure to update it
  Plot.validateInfo = function (existingObj) {
    // TODO temp convert variable names etc here if they change
    return Plot.generateNewInfo(existingObj.type, existingObj.birthTick, existingObj);
  }

  Plot.globalTemplate = {
    type: null,
    birthTick: 0,
    itemAvailable: null,
  }
  Plot.typeTemplates = {
    empty: { },
    emptybeehive: { },
    cactus: {
      pollinatedType: null,
    },
    beehive: {
      nectar: 0,
      honeyCombCounter: 0,
    },
  }

  Plot.GROWTH_AGES = [0, 4, 10, 25];

  Plot.EMPTY_SPAWN_TIME = 20
  Plot.SPAWN_CHANCE = .005
  Plot.DIE_TIME = 30
  Plot.DIE_CHANCE = .05

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Plot
  } else {
    window.Plot = Plot
  }
})();
