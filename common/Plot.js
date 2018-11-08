;(function() {
  var Plot = function (startType, birthTick) {
    var info = Plot.generateNewInfo(startType, birthTick)

    // Define which variables and methods can be accessed
    return {
      info: info,
    }
  }

  Plot.generateNewInfo = function(startType, birthTick) {
    return {
      type: startType,
      birthTick: birthTick,
      itemAvailable: null,
      pollinatedType: null, // type of pollen used to pollinate
    }
  }

  Plot.isPlot = function(type) {
    return type.startsWith("cactus");
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
