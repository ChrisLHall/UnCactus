var ItemUIButton = function (group, slot, screenX, screenY) {
  this.group = group;
  this.slot = slot;

  this.buttonGameObj = new UIButton(group, "itemsUI", 0, screenX, screenY, this.onClick)

  this.gameObj = group.create(screenX, screenY, "items")
  this.gameObj.obj = this;
  this.gameObj.anchor.setTo(0.5, 0.5);
  this.updateGFX();
}

ItemUIButton.prototype.updateGFX = function () {
  Item.setupAnims(this.gameObj);
  // TODO update the icon based on whats in the slot
  if (inventory[this.slot]) {
    this.gameObj.visible = true;
    this.gameObj.animations.play("seed");
  } else {
    this.gameObj.visible = false;
  }
}

ItemUIButton.prototype.onClick = function(pointer) {
    // the click used by UI has already been handled
    // TODO logic to use item
    console.log("Clicked item slot " + this.slot);
}
