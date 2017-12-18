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

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = CommonUtil
  else
    window.CommonUtil = CommonUtil
})();
