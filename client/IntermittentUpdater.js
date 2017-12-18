//host must implement host.exists()
// intermittentFunc = function (host) {}
var IntermittentUpdater = function (host, intermittentFunc, countMax) {
  this.countMax = countMax
  this.intermittentFunc = intermittentFunc
  this.counter = 0
  this.finished = false
  this.host = host
}

IntermittentUpdater.prototype.update = function () {
  if (this.finished || !this.host.exists()) {
    this.finished = true
    return
  }
  this.counter++
  if (this.counter >= this.countMax) {
    this.intermittentFunc.call(this.host)
    this.counter = 0
  }
}

window.IntermittentUpdater = IntermittentUpdater
