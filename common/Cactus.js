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
    }
  }

  Cactus.isCactus = function(type) {
    return type.startsWith("cactus");
  }

  Cactus.GROWTH_AGES = [0, 4, 10, 18];

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
