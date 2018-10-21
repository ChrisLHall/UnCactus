var ItemUIButton = function (group, slot, screenX, screenY) {
  this.group = group;
  this.slot = slot;

  this.button = new UIButton(group, "itemsUI", 0, screenX, screenY, this.onClick);
  this.button.itemUIButton = this; // gotta have a reference to this
  for (var i = 0; i < 8; i++) {
    this.button.gameObj.animations.add(i.toString(), [i], 1, true)
  }
  this.button.gameObj.animations.play("0")
  this.deleteButton = new UIButton(group, "itemsUI", 4, screenX, screenY - 100, this.onClickDelete);
  this.deleteButton.itemUIButton = this;

  this.gameObj = group.create(screenX, screenY, "items")
  this.gameObj.obj = this;
  this.gameObj.anchor.setTo(0.5, 0.5);
  Item.setupAnims(this.gameObj);
  this.updateGFX();
}

ItemUIButton.prototype.updateGFX = function () {
  if (!player) {
    return;
  }

  var selected = (player.selectedItemSlot === this.slot);

  if (selected) {
    this.button.gameObj.animations.play("1")
  } else {
    this.button.gameObj.animations.play("0")
  }
  this.deleteButton.gameObj.visible = selected;
  
  var item = player.info.inventory[this.slot];
  if (item) {
    this.gameObj.visible = true;
    this.gameObj.animations.play(item);
  } else {
    this.gameObj.visible = false;
  }
}

ItemUIButton.prototype.onClick = function(pointer) {
  // 'this' in this context is the UIButton...i know...dumb
  if (!player) {
    return;
  }

  // TODO first check if we should select/deselect this item
  if (player.selectedItemSlot === this.itemUIButton.slot) {
    player.selectedItemSlot = null;
  } else {
    if (player.itemRequiresTarget(this.itemUIButton.slot)) {
      player.selectedItemSlot = this.itemUIButton.slot;
    } else {
      socket.emit('use item', { slot: this.itemUIButton.slot, targetPlanet: null, targetSlot: null });
      player.selectedItemSlot = null;
    }
  }
  
  player.updateInventoryGFX();
}

ItemUIButton.prototype.onClickDelete = function(pointer) {
  // 'this' in this context is the UIButton
  if (!player) {
    return;
  }

  var selected = (player.selectedItemSlot === this.itemUIButton.slot);
  if (selected) {
    socket.emit('delete item', { slot: this.itemUIButton.slot });
  }
}
