'use strict';
var path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants'));

module.exports = {
  calculateCalories: function (height, weight, steps) {
    if (!height || !weight || !steps) {
      return 0;
    }

    const stride = height * constants.HEIGHT_TO_STRIDE_RATE;

    // 100000 : cm -> km
    const distance = steps * stride / 100000;
    const time = distance / constants.SPEED;
    const exercise = 3.3 * time;
    const calories = 1.05 * exercise * weight;

    return Math.floor(calories);
  },

  convertStepsToPoints: function (steps, pps) {
    if (!steps || !pps) {
      return 0;
    }

    return steps * pps;
  },

  convertStepsToAmounts: function (steps, aps) {
    if (!steps || !aps) {
      return 0;
    }

    return steps * aps;
  },

  convertAmountsToSteps: function (steps, aps) {
    if (!steps || !aps) {
      return 0;
    }

    return steps / aps;
  },

  calculateAverageStepsOfEvent: function (totalSteps, number_of_participants) {
    if (!totalSteps || !number_of_participants) {
      return 0;
    }

    const averageSteps = Math.round(totalSteps / number_of_participants);
    return averageSteps;
  },

  calculateTotal: function (realityTotal, rate) {
    if (!realityTotal || !rate) {
      return 0;
    }

    return Math.round(realityTotal * rate);
  },

  roundSteps: function (steps) {
    if (!steps) {
      return 0;
    }

    return Math.round(steps);
  }
};

