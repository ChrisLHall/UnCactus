;(function(){
  var CommonUtil = {}
  CommonUtil.validate = function (objToValidate, templateObj) {
    for (var property in templateObj) {
      if (templateObj.hasOwnProperty(property)) {
        if (!(property in objToValidate)) {
          objToValidate[property] = templateObj[property]
        }
      }
    }
  }

  CommonUtil.DEG_TO_RAD = 3.141592653589792 / 180

  CommonUtil.clamp = function (x, min, max) {
    return Math.max(min, Math.min(max, x));
  }

  CommonUtil.withinXY = function(pos1, pos2, xDist, yDist) {
    return Math.abs(pos1.x - pos2.x) <= xDist && Math.abs(pos1.y - pos2.y) <= yDist;
  }

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = CommonUtil
  else
    window.CommonUtil = CommonUtil
})();
