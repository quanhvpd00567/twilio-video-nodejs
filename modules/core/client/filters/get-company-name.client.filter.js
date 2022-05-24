(function () {
  'use strict';
  angular.module('core').filter('get_company_name', getCompanyName);

  function getCompanyName() {
    return function (name, kind, company_name_affix, COMPANY_KIND) {
      if (!name || !kind || !company_name_affix || !COMPANY_KIND) {
        return name;
      }

      switch (kind) {
        case COMPANY_KIND.PREVIOUS_STOCK:
          return company_name_affix + name;
        case COMPANY_KIND.BACK_STOCK:
          return name + company_name_affix;
        default:
          return name;
      }
    };
  }
}());
