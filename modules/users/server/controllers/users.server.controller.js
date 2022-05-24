'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Card = mongoose.model('Card'),
  passport = require('passport'),
  Config = mongoose.model('Config'),
  path = require('path'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  helpServerController = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  mailerServerUtil = require(path.resolve('./modules/core/server/utils/mailer.server.util')),
  master_data = require(path.resolve('./config/lib/master-data'));

const lang = 'ja';
const ROLE = constants.ROLE;
/**
 * 管理者機能
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) return res.status(422).send({ message: helpServerController.getMsLoc(lang, 'sign_in.form.server.error.username_or_password_incorrect') });
    if (req.body.isEcommerce) {
      if (!user.roles.includes('employee')) return res.status(422).json({ message: helpServerController.getMsLoc('ja', 'common.server.error.permission') });
    } else {
      if (user.roles[0] === ROLE.EMPLOYEE) return res.status(422).json({ message: helpServerController.getMsLoc('ja', 'common.server.error.permission') });
    }

    // Remove sensitive data before login
    user.password = null;
    user.salt = null;
    req.login(user, function (err) {
      if (err) {
        logger.error(err);
        return res.status(400).send({ message: helpServerController.getMsLoc(lang, 'sign_in.form.server.error.username_or_password_incorrect') });
      }
      return res.json(user);
    });
  })(req, res, next);
};

exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

exports.signoutEcommerce = function (req, res) {
  req.logout();
  res.redirect('/ec/signin');
};

exports.password = function (req, res) {
  if (!req.user) return res.status(400).send({ message: helpServerController.getMsLoc() });
  var passwordDetails = req.body;

  if (!passwordDetails.newPassword)
    return res.status(400).send({ message: helpServerController.getMsLoc(lang, 'change_password.form.new_password.error.required') });

  User.findById(req.user._id, function (err, user) {
    if (err || !user)
      return res.status(400).send({ message: helpServerController.getMsLoc(lang, 'change_password.form.server.error.account_not_found') });

    if (user.authenticate(passwordDetails.currentPassword)) {
      if (passwordDetails.newPassword !== passwordDetails.verifyPassword)
        return res.status(422).send({ message: helpServerController.getMsLoc(lang, 'change_password.form.server.error.confirmation_password_not_match') });

      user.password = passwordDetails.newPassword;
      user.is_required_update_password = false;
      user.save(function (err) {
        if (err) {
          logger.error(err);
          return res.status(422).send({ message: helpServerController.getMsLoc(lang, 'change_password.form.server.error.save_failed') });
        }
        req.login(user, function (err) {
          if (err) {
            logger.error(err);
            return res.status(400).send(err);
          }
          return res.end();
        });
      });
    } else {
      return res.status(422).send({ message: helpServerController.getMsLoc(lang, 'change_password.form.server.error.current_password_wrong') });
    }
  });
};

exports.config = function (req, res) {
  Config.findOne().then(conf => {
    return res.jsonp({
      master: master_data.masterdata,
      config: conf,
      version: conf.version
    });
  }).catch(err => {
    logger.error(err);
    return res.status(422).send({
      message: helpServerController.getMsLoc(lang, 'common.server.error')
    });
  });
};

exports.resetPass = async function (req, res) {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(500).send({ message: helpServerController.getMsLoc() });
    }

    const email_lower = helpServerController.trimAndLowercase(email);
    const [user, newPassword] = await Promise.all([
      User.findOne({ email_lower, roles: { $in: [constants.ROLE.COMPANY, constants.ROLE.MUNIC_ADMIN, constants.ROLE.MUNIC_MEMBER, constants.ROLE.ADMIN] }, deleted: false }),
      User.generateRandomPassphrase()
    ]);

    if (!user) {
      return res.status(422).send({
        message: helpServerController.getMsLoc('ja', 'reset_password.form.server.error.email_not_found')
      });
    }

    if (!newPassword) {
      return res.status(500).send({ message: helpServerController.getMsLoc() });
    }

    user.password = newPassword;
    await user.save();

    // Send mail
    mailerServerUtil.sendMailResetPassForAdmin(email_lower, newPassword, user.name, false);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: helpServerController.getMsLoc() });
  }
};

exports.resetPassEcommerce = async function (req, res) {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(500).send({ message: helpServerController.getMsLoc() });
    }

    const email_lower = helpServerController.trimAndLowercase(email);
    const [user, newPassword] = await Promise.all([
      User.findOne({ email_lower, roles: { $in: [constants.ROLE.COMPANY, constants.ROLE.EMPLOYEE] }, deleted: false }),
      User.generateRandomPassphrase()
    ]);

    if (!user) {
      return res.status(422).send({
        message: helpServerController.getMsLoc('ja', 'reset_password.form.server.error.email_not_found')
      });
    }

    if (!newPassword) {
      return res.status(500).send({ message: helpServerController.getMsLoc() });
    }

    user.password = newPassword;
    await user.save();

    // Send mail
    mailerServerUtil.sendMailResetPassForAdmin(email_lower, newPassword, user.name, true);

    return res.json(true);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: helpServerController.getMsLoc() });
  }
};

// confirm email register
exports.confirm = async function (req, res) {
  try {
    const token = req.body.token;
    if (!token) {
      return res.json(false);
    }
    const [user, config] = await Promise.all([
      User.findOne({ token, roles: constants.ROLE.EMPLOYEE, deleted: false, status: constants.USER_STATUS.PENDING }),
      Config.findOne()
    ]);
    if (!user) {
      return res.json({ success: false, appConfig: config && config.app });
    }

    user.status = constants.USER_STATUS.CONFIRMED;
    await user.save();

    return res.json({ success: true, appConfig: config && config.app });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: helpServerController.getMsLoc() });
  }
};

exports.confirmUpdateEmail = async function (req, res) {
  try {
    const token = req.body && req.body.token;
    if (!token) {
      return res.json({ success: false });
    }

    let [user, config] = await Promise.all([
      User.findOne({ token_update_email: token, deleted: false }),
      Config.findOne()
    ]);

    if (!user) {
      return res.json({ success: false });
    }

    // Check expiry
    if (new Date(user.token_update_email_expire_at) < new Date()) {
      return res.json({ success: false });
    }

    const tmp_email = user.tmp_email;
    if (!tmp_email) {
      return res.json({ success: false });
    }

    const isExistingEmail = await User.findOne({ email_lower: tmp_email.toLowerCase(), deleted: false, _id: { $ne: user._id } }).select('_id').lean();
    if (isExistingEmail) {
      return res.json({ success: false, message: helpServerController.getMsLoc('ja', 'server.update_email.email.error.exists') });
    }
    user.email = tmp_email;
    user.tmp_email = null;

    user.token_update_email = null;
    user.token_update_email_expire_at = null;

    await user.save();

    return res.json({ success: true, appConfig: config && config.app });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: helpServerController.getMsLoc() });
  }
};

exports.getListCard = async function (req, res) {
  try {
    Card.find({ user: new mongoose.Types.ObjectId(req.user._id), deleted: false })
      .exec()
      .then(cards => res.json(cards));
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: helpServerController.getMsLoc() });
  }
};

