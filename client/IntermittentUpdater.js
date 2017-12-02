/* global game */

var IntermittentUpdater = function (countMax, intermittentFunc) {
  this.countMax = countMax
  this.intermittentFunc = intermittentFunc
  this.counter = 0
}

IntermittentUpdater.prototype.update = function () {
  this.counter++
  if (this.counter >= this.countMax) {
    this.intermittentFunc()
  }
}

window.IntermittentUpdater = IntermittentUpdater
