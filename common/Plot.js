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
    if (existingObj.type === "cactus1") {
      existingObj.type = "cactus";
      existingObj.variant = 1;
    }
    // do the proper validation now
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
      variant: 1,
      growState: 0,
      lastGrowTick: 0,
      timesFlowered: 0,
      pollinatedType: null,
    },
    beehive: {
      nectar: 0,
      honeyCombCounter: 0,
    },
  }

  Plot.GROWTH_AGES = [4, 6, 15, 10];

  Plot.EMPTY_SPAWN_TIME = 20;
  Plot.SPAWN_CHANCE = .008;
  Plot.DIE_CHANCE = .3;
  Plot.MAX_FLOWERS = 2;

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Plot
  } else {
    window.Plot = Plot
  }
})();
