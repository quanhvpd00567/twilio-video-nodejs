'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  paginate = require('mongoose-paginate-v2'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  ROLES = Object.keys(constants.ROLE).map(key => constants.ROLE[key]);
/**
 * User Schema
 */
var UserSchema = new Schema({
  // use for admin only (to login)
  username: { type: String },

  // メールアドレス
  email: { type: String, trim: true, required: true },
  email_lower: { type: String, trim: true },
  tmp_email: { type: String, trim: true },

  // パスワード
  password: { type: String, required: true },
  is_required_update_password: { type: Boolean, default: false },

  first_name: { type: String },
  last_name: { type: String },
  phone: { type: String },
  number: { type: String },
  note: { type: String },
  department: { type: String },
  e_department: { type: Schema.ObjectId, ref: 'Department' },
  // 氏名,
  name: { type: String },
  // ニックネーム
  nickname: { type: String, trim: true },
  // 役割
  roles: {
    type: [{ type: String, enum: ROLES }],
    required: true
  },
  // status: {
  //   type: Number,
  //   enum: [constants.USER_STATUS.PENDING, constants.USER_STATUS.CONFIRMED],
  //   default: constants.USER_STATUS.PENDING
  // },

  height: { type: Number }, // cm
  stride: { type: Number }, // cm
  weight: { type: Number }, // kg
  target_steps_per_day: { type: Number },

  company: { type: Schema.ObjectId, ref: 'Company' }, // require if role is employee
  subsidiary: { type: Schema.ObjectId, ref: 'Subsidiary' }, // require if role is employee
  municipality: { type: Schema.ObjectId, ref: 'Municipality' },

  // last update os steps to calculate new steps
  last_get_data_date: { type: Date, default: Date.now },

  // current joining comproject of employee
  comproject_joining: { type: Schema.ObjectId, ref: 'Comproject' },

  // デバイス一覧
  devices: [{ type: Schema.ObjectId, ref: 'Device' }],

  // Token for register
  token: { type: String },
  token_expire_at: { type: Date },

  // Setting
  settings: {
    receive_notification: { type: Boolean, default: true }
  },

  is_can_config_version: { type: Boolean, default: false },
  // System info
  last_login: { type: Date },
  login_times: { type: Number },

  // Token for opening ec site in App
  token_ec_site: { type: String },

  deleted: { type: Boolean, default: false },
  updated: { type: Date },
  created: { type: Date, default: Date.now },
  salt: { type: String }
}, { autoCreate: true });
UserSchema.plugin(paginate);
UserSchema.plugin(mongooseAggregatePaginate);

UserSchema.pre('save', function (next) {
  var doc = this;
  if (this.password && this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
  }

  if (this.email && this.isModified('email')) {
    this.email_lower = this.email.toLowerCase();
  }

  if (this.height && this.isModified('height')) {
    this.stride = this.height * constants.HEIGHT_TO_STRIDE_RATE;
  }

  if (this.first_name && this.last_name && (this.isModified('first_name') || this.isModified('last_name'))) {
    this.name = `${this.last_name} ${this.first_name}`;
  }

  next();
});

UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, Buffer.from(this.salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
  } else {
    return password;
  }
};

UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

UserSchema.statics.generateRandomPassphrase = function () {
  return new Promise(function (resolve, reject) {
    var password = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 8; i++) {
      password += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return resolve(password);
  });
};
UserSchema.statics.uniqueUserName = function (username, id) {
  return new Promise(function (resolve, reject) {
    var User = mongoose.model('User');
    var query = { username: username, deleted: false };
    if (id) {
      query._id = { '$ne': id };
    }

    User.findOne(query).exec(function (err, user) {
      if (err) return reject(err);
      if (!user) return resolve(false);
      if (user) return resolve(true);
    });
  });
};

UserSchema.statics.validPassword = function (password) {
  if (!password || !password.length) return false;
  if (password.length < 8 || password.length > 32 || !validator.isAlphanumeric(password)) {
    return 'パスワードは８～３２桁の半角英数字を入力してください。';
  } else {
    return false;
  }
};

UserSchema.statics.removeAccount = function (userId) {
  return new Promise(function (resolve, reject) {
    var User = mongoose.model('User');
    User.findById(userId).exec(function (err, user) {
      user.remove(function (err) {
        if (err) reject(err);
        resolve(user);
      });
    });
  });
};

UserSchema.statics.createToken = function () {
  return crypto.randomBytes(64).toString('hex');
};

UserSchema.statics.seed = seed;
mongoose.model('User', UserSchema);

/**
* Seeds the User collection with document (User)
* and provided options.
*/
function seed(doc, options) {
  var User = mongoose.model('User');

  return new Promise(function (resolve, reject) {

    skipDocument()
      .then(function () {
        return add(doc);
      })
      .then(function (response) {
        return resolve(response);
      })
      .catch(function (err) {
        return reject(err);
      });

    function skipDocument() {
      return new Promise(function (resolve, reject) {
        User.findOne({ username: doc.username }).exec(function (err, user) {
          if (err) return reject(err);
          if (!user) return resolve(false);
          // Remove User (overwrite)
          user.remove(function (err) {
            if (err) return reject(err);
            return resolve(false);
          });
        });
      });
    }

    function add(doc) {
      return new Promise(function (resolve, reject) {
        var user = new User(doc);
        user.save(function (err) {
          if (err) return reject(err);
          return resolve({ message: 'メール： ' + user.email + ' ・パスワード： 12345678' });
        });
      });
    }
  });
}
