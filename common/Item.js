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
    seed_1: 0,
    pollen_1: 1,
    honey: 2,
    nectar_1: 3,
    honeycomb: 4,
    seed_2: 5,
    pollen_2: 6,
    seed_3: 7,
    pollen_3: 8,
    nectar_2: 9,
    nectar_3: 10,
    superhoney: 11,
  }

  Item.requiresTarget = function (item) {
    return (item.startsWith("pollen") || item.startsWith("seed") || item.startsWith("nectar") || item === "honeycomb");
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Item
  } else {
    window.Item = Item
  }
})();
