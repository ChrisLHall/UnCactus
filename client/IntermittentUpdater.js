/* global game */

var IntermittentUpdater = function (intermittentFunc, countMax) {
  this.countMax = countMax
  this.intermittentFunc = intermittentFunc
  this.counter = 0
}

IntermittentUpdater.prototype.update = function () {
  this.counter++
  if (this.counter >= this.countMax) {
    this.intermittentFunc()
    this.counter = 0
  }
}

window.IntermittentUpdater = IntermittentUpdater
