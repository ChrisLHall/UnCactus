;(function() {
  var Cactus = function (startType, startTimeUTC) {
    var info = Cactus.generateNewInfo(startType, startTimeUTC)

    // Define which variables and methods can be accessed
    return {
      info: info,
    }
  }

  Cactus.generateNewInfo = function(startType, startTimeUTC) {
    return {
      type: startType,
      lastGrowTime: startTimeUTC,
    }
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Cactus
  } else {
    window.Cactus = Cactus
  }
})();
