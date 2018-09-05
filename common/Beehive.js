;(function() {
  var Beehive = function (startType, ownerID) {
    var info = Beehive.generateNewInfo(startType, ownerID)

    // Define which variables and methods can be accessed
    return {
      info: info,
    }
  }

  Beehive.generateNewInfo = function(startType, ownerID) {
    return {
      type: startType,
      ownerID: ownerID,
    }
  }

  Beehive.isBeehive = function(type) {
    return type.startsWith("beehive")
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Beehive
  } else {
    window.Beehive = Beehive
  }
})();
