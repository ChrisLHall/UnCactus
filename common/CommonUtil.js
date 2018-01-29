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

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = CommonUtil
  else
    window.CommonUtil = CommonUtil
})();
