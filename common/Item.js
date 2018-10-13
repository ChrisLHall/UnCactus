;(function() {
  var Item = function () {
    // dont think i need this to be instantiable
  }

  // client only 
  Item.setupAnims = function(gameObj) {
    for (var type in Item.typeToFrame) {
      if (Item.typeToFrame.hasOwnProperty(type)) {
        gameObj.animations.add(type, [Item.typeToFrame[type]], 0, true);
      }
    }
  }

  Item.typeToFrame = {
    seed: 0,
    pollen: 1,
    honey: 2,
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Item
  } else {
    window.Item = Item
  }
})();
