;(function() {
  var Cactus = function (startType, startTimeUTC) {
    var info = Cactus.generateNewInfo(startType, startTimeUTC)

    // Define which variables and methods can be accessed
    return {
      info: info,
    }
  }

  Cactus.generateNewInfo = function(startType) {
    return {
      type: startType,
      birthTick: 0,
    }
  }

  Cactus.GROWTH_AGES = [0, 1, 4, 12]

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Cactus
  } else {
    window.Cactus = Cactus
  }
})();
