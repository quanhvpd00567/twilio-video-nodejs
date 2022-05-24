(function () {
  'use strict';

  angular
    .module('core')
    .factory('ConditionFactory', ConditionFactory);

  function ConditionFactory() {
    this.conditions = [];
    this.get = function (module) {
      return this.conditions[module];
    };
    this.set = function (module, condition) {
      this.conditions[module] = condition;
    };
    this.update = function (module, condition) {
      _.extend(this.conditions[module], condition);
    };
    this.delete = function (module) {
      delete this.conditions[module];
    };
    return this;
  }
}());
