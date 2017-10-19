/* Interactions.js */

// definitions for tiles, by ID
// all tiles have "cost"
// must define "action" as: "spawns", "moves", "grinds", "packs", "cooks", "sells", "blocks"
// use "movex" and "movey" as -1, 0, 1
// use "spawns" for caves to define what ids they spawn
var Interactions = {
  tileDefs: {
    1: {
      cost: 2,
      action: 'moves',
      movex: 0,
      movey: 1,
    },
    2: {
      cost: 2,
      action: 'moves',
      movex: 0,
      movey: -1,
    },
    3: {
      cost: 2,
      action: 'moves',
      movex: -1,
      movey: 0,
    },
    4: {
      cost: 2,
      action: 'moves',
      movex: 1,
      movey: 0,
    },

    5: {
      cost: 10,
      action: 'grinds',
    },
    6: {
      cost: 50,
      action: 'spawns',
      spawns: 4,
    },
    7: {
      cost: 30,
      action: 'sells',
    },
    8: {
      cost: 10,
      action: 'cooks',
    },
    9: {
      cost: 10,
      action: 'packs',
    },

    10: {
      cost: 100,
      action: 'spawns',
      spawns: 8,
    },
    11: {
      cost: 260,
      action: 'spawns',
      spawns: 12,
    },
    12: {
      cost: 1000,
      action: 'spawns',
      spawns: 16,
    },
    13: {
      cost: 2,
      action: 'blocks',
    },
  },

  // definitions for items, by ID
  // types are "creature", "product"
  // all items have "sells" aka value
  // actions are "grinds", "packs", "cooks" ... what is the resulting ID
  itemDefs: {
    1: {
      type: 'product',
      sells: 0,
      packs: 2,
    },
    2: {
      type: 'product',
      sells: 0,
      cooks: 3,
    },
    3: {
      type: 'product',
      sells: 2,
    },
    4: {
      type: 'creature',
      sells: 0,
      grinds: 1,
    },

    5: {
      type: 'product',
      sells: 0,
      packs: 6,
    },
    6: {
      type: 'product',
      sells: 0,
      cooks: 7,
    },
    7: {
      type: 'product',
      sells: 4,
    },
    8: {
      type: 'creature',
      sells: 0,
      grinds: 5,
    },
    
    9: {
      type: 'product',
      sells: 0,
      packs: 10,
    },
    10: {
      type: 'product',
      sells: 0,
      cooks: 11,
    },
    11: {
      type: 'product',
      sells: 9,
    },
    12: {
      type: 'creature',
      sells: 0,
      grinds: 9,
    },

    13: {
      type: 'product',
      sells: 0,
      packs: 14,
    },
    14: {
      type: 'product',
      sells: 0,
      cooks: 15,
    },
    15: {
      type: 'product',
      sells: 30,
    },
    16: {
      type: 'creature',
      sells: 0,
      grinds: 13,
    },
  },
}

module.exports = Interactions
