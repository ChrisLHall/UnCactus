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

  CommonUtil.transferCommonProps = function (newObj, oldObj) {
    for (var property in oldObj) {
      if (oldObj.hasOwnProperty(property) && newObj.hasOwnProperty(property)) {
        newObj[property] = oldObj[property]
      }
    }
  }

  CommonUtil.splitVariantString = function (variantString) {
    var name = variantString;
    var variant = null;
    var underscoreIdx = name.indexOf("_");
    if (underscoreIdx !== -1) {
      variant = parseInt(name.substring(underscoreIdx + 1, name.length));
      name = name.substring(0, underscoreIdx);
    }
    return { name: name, variant: variant, };
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
