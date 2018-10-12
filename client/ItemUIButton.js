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
    // TODO update the icon based on whats in the slot
  this.gameObj.animations.add("anim", [0], 10, true);
  this.gameObj.animations.play("anim");
  this.gameObj.visible = false;
}

ItemUIButton.prototype.onClick = function(pointer) {
    // the click used by UI has already been handled I think
    // TODO logic to use item
}
