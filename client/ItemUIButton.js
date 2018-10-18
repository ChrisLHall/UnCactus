var ItemUIButton = function (group, slot, screenX, screenY) {
  this.group = group;
  this.slot = slot;

  this.buttonGameObj = new UIButton(group, "itemsUI", 0, screenX, screenY, this.onClick)
  this.buttonGameObj.itemUIButton = this; // gotta have a reference to this

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

  // the click used by UI has already been handled
  socket.emit('use item', { slot: this.itemUIButton.slot });
}
