'use strict';

/**
 * Module dependencies
 */
var policy = require('../policies/products.server.policy'),
  productController = require('../controllers/products.server.controller');

module.exports = function (app) {
  app.route('/api/products').get(policy.isAllowed, productController.list);
  app.route('/api/products').post(policy.isAllowed, productController.create);
  app.route('/api/products/image').post(policy.isAllowed, productController.uploadImage);
  app.route('/api/products/upload-pictures').post(policy.isAllowed, productController.uploadPictures);
  app.route('/api/products/has-using').get(policy.isAllowed, productController.hasUsing);
  app.route('/api/municipality').get(policy.isAllowed, productController.getMunicipality);

  // Single notice routes
  app.route('/api/products/:productId')
    .get(policy.isAllowed, productController.detail)
    .put(policy.isAllowed, productController.update)
    .delete(policy.isAllowed, productController.delete);

  // Finish by binding the notice middleware
  app.param('productId', productController.productById);
};
