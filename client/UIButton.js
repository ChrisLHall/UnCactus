var UIButton = function (group, animName, frame, screenX, screenY, touchAction) {
  this.group = group
  this.touchAction = touchAction

  this.gameObj = group.create(screenX, screenY, animName)
  this.gameObj.obj = this;
  this.gameObj.anchor.setTo(0.5, 0.5);
  this.gameObj.inputEnabled = true;
  this.gameObj.animations.add("anim", [frame], 10, true);
  this.gameObj.animations.play("anim")
  this.gameObj.events.onInputDown.add(this.onClick, this);
}

UIButton.prototype.onClick = function(pointer) {
  if (clickUsedByUI) {
    return;
  }
  clickUsedByUI = true // ALWAYS DO THIS FIRST
  this.touchAction.call(this, pointer)
}
