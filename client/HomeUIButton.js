var HomeUIButton = function (group, homeIdx, screenX, screenY) {
  this.group = group;
  this.homeIdx = homeIdx;

  this.button = new UIButton(group, "gohome", 0, screenX, screenY, this.onClick);
  this.button.homeUIButton = this; // gotta have a reference to this
  this.button.gameObj.animations.play("0")
  this.deleteButton = new UIButton(group, "itemsUI", 4, screenX, screenY + 100, this.onClickDelete);
  this.deleteButton.homeUIButton = this;

  this.updateGFX();
}

HomeUIButton.prototype.updateGFX = function () {
  if (!player) {
    return;
  }

  // TODO fade out if there isn't an available planet for it
  // TODO get a list of home planets
  var selected = (player.sittingOnPlanetObj === this.slot);

  this.deleteButton.gameObj.visible = selected;
}

HomeUIButton.prototype.onClick = function(pointer) {
  // 'this' in this context is the UIButton...i know...dumb
  if (!player) {
    return;
  }

  // TODO first check if we should select/deselect this item
  /*
  if (player.selectedItemSlot === this.homeUIButton.slot) {
    player.selectedItemSlot = null;
  } else {
    if (player.itemRequiresTarget(this.homeUIButton.slot)) {
      player.selectedItemSlot = this.homeUIButton.slot;
    } else {
      socket.emit('use item', { slot: this.homeUIButton.slot, targetPlanet: null, targetSlot: null });
      player.selectedItemSlot = null;
    }
  }
  
  player.updateInventoryGFX();
  */
}

HomeUIButton.prototype.onClickDelete = function(pointer) {
  // 'this' in this context is the UIButton
  if (!player) {
    return;
  }
  /*
  var selected = (player.selectedItemSlot === this.homeUIButton.slot);
  if (selected) {
    socket.emit('delete item', { slot: this.homeUIButton.slot });
  }
  */
}
