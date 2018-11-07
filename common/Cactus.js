;(function() {
  var Cactus = function (startType, birthTick) {
    var info = Cactus.generateNewInfo(startType, birthTick)

    // Define which variables and methods can be accessed
    return {
      info: info,
    }
  }

  Cactus.generateNewInfo = function(startType, birthTick) {
    return {
      type: startType,
      birthTick: birthTick,
      itemAvailable: null,
      pollinatedType: null, // type of pollen used to pollinate
    }
  }

  Cactus.isCactus = function(type) {
    return type.startsWith("cactus");
  }

  Cactus.globalTemplate = {
    type: null,
    birthTick: 0,
    itemAvailable: null,
  }
  Cactus.typeTemplates = {
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

  Cactus.GROWTH_AGES = [0, 4, 10, 25];

  Cactus.EMPTY_SPAWN_TIME = 20
  Cactus.SPAWN_CHANCE = .005
  Cactus.DIE_TIME = 30
  Cactus.DIE_CHANCE = .05

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Cactus
  } else {
    window.Cactus = Cactus
  }
})();
