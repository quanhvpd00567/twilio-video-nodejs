'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  Location = mongoose.model('Location'),
  User = mongoose.model('User'),
  path = require('path'),
  { v4: uuidv4 } = require('uuid'),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  _ = require('lodash'),
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  help = require(path.resolve('./modules/core/server/controllers/help.server.controller'));

const lang = 'ja';
const accountSid = 'ACdbe1000690ca780d9fa660264be466ae';
const authToken = '6f66ff0065985942610dceefbccc9ae1';
// const client = require('twilio')(accountSid, authToken, {
//   lazyLoading: true
// });


const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// const Video = require('twilio-video');

// Serialize the token to a JWT string
exports.createRoomZoom = async function (req, res) {
  const identity = uuidv4();

  // Create Video Grant
  const videoGrant = new VideoGrant({
    room: 'Myroom'
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(
    'ACa31def3feb11a648b05415bf87dfe9cf',
    'SKb848536251d84d72f85a2a2f27a1dfad',
    '8xVmEETPfOvqFwLt31V2MxcryHagw8Ud',
    { identity: identity }
  );

  token.addGrant(videoGrant);

  // Video.connect(token.toJwt(), { name: 'Myroom' }).then(room => {
  //   console.log(room);
  // });

  try {
    return res.json(token.toJwt());
  } catch (error) {
    console.log(error.response.data);
    return res.status(422).send({ message: help.getMsLoc() });
  }

};

exports.create = async function (req, res) {
  let session = null;
  try {
    let data = req.body;
    if (!data) {
      return res.status(422).send({ message: help.getMsLoc() });
    }

    const locationObject = {
      name: data.name,
      code: data.code,
      municipality: data.municipality
    };
    let userObject = data.admin;
    userObject.roles = constants.ROLE.LOCATION;
    const email_lower = help.trimAndLowercase(userObject.email);
    const [isEmailExisting, isNumberExisting, isCodeExisting] = await Promise.all([
      User.findOne({ email_lower, deleted: false }).lean(),
      userObject.number ? User.findOne({ municipality: locationObject.municipality, number: userObject.number, roles: constants.ROLE.LOCATION, deleted: false }).lean() : null,
      Location.findOne({ municipality: locationObject.municipality, deleted: false, code: locationObject.code }).lean()
    ]);

    if (isEmailExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
    }
    if (isNumberExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.server.error.number_exists') });
    }
    if (isCodeExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.server.error.code_exists') });
    }

    let locationCreated = new Location(locationObject);
    let userCreated = new User(userObject);

    session = await mongoose.startSession();
    session.startTransaction();

    locationCreated.admin = userCreated._id;
    locationCreated = await locationCreated.save({ session });

    userCreated.municipality = locationCreated.municipality;
    userCreated.location = locationCreated._id;
    userCreated = await userCreated.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json(locationCreated);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.paging = async function (req, res) {
  try {
    const condition = req.body.condition || {};
    const page = condition.page || 1;
    const limit = help.getLimit(condition);
    const options = { page, limit };

    const isMunicipalityQuery = req.user.roles[0] === constants.ROLE.MUNICIPALITY;
    if (isMunicipalityQuery) {
      condition.municipalityId = req.user.municipality;
    }
    const aggregates = getQueryAggregate(condition, isMunicipalityQuery);
    let result = await Location.aggregatePaginate(Location.aggregate(aggregates).allowDiskUse(true).collation({ locale: 'ja' }), options);
    result = help.parseAggregateQueryResult(result, page);

    return res.json(result);
  } catch (error) {
    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.read = function (req, res) {
  res.json(req.model);
};

exports.update = async function (req, res) {
  let session = null;
  try {
    const body = req.body;

    // Prepare data update
    const dataUpdate = {
      name: body.name,
      code: body.code,
      municipality: body.municipality
    };

    const adminUpdate = {
      first_name: body.admin.first_name,
      last_name: body.admin.last_name,
      email: body.admin.email,
      number: body.admin.number,
      phone: body.admin.phone
    };

    if (body.password && body.password !== '') {
      adminUpdate.password = body.password;
    }

    let [account, isCodeExisting] = await Promise.all([
      User.findOne({ deleted: false, _id: req.model.admin._id }),
      Location.findOne({ deleted: false, _id: { $ne: req.model._id }, municipality: dataUpdate.municipality, code: dataUpdate.code }).lean()
    ]);
    if (!account) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'locations.server.error.not_found') });
    }

    if (isCodeExisting) {
      return res.status(422).send({ message: help.getMsLoc(lang, 'municipalities.form.server.error.code_exists') });
    }

    // Check email exists
    if (account.email !== adminUpdate.email) {
      const email_lower = help.trimAndLowercase(adminUpdate.email);
      const isEmailExisting = await User.findOne({ email_lower, deleted: false, _id: { $ne: account._id } }).lean();
      if (isEmailExisting) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'common.server.email.error.exists') });
      }
    }
    // Check number exists
    if (adminUpdate.number && account.number !== adminUpdate.number) {
      const isNumberExisting = await User.findOne({ municipality: dataUpdate.municipality, number: adminUpdate.number, roles: constants.ROLE.LOCATION, deleted: false, _id: { $ne: account._id } }).lean();
      if (isNumberExisting) {
        return res.status(422).send({ message: help.getMsLoc(lang, 'locations.form.server.error.number_exists') });
      }
    }

    session = await mongoose.startSession();
    session.startTransaction();

    await Location.updateOne({ _id: req.model._id }, dataUpdate, { session });

    account = _.extend(account, adminUpdate);
    await account.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json(req.model);
  } catch (error) {
    logger.error(error);
    abortTransaction(session);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.delete = async function (req, res) {
  let session = await mongoose.startSession();
  session.startTransaction();

  try {
    let location = req.model;
    await Location.updateOne({ _id: location._id }, { deleted: true }).session(session);
    await User.updateMany({ location: location._id }, { deleted: true }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.json(location);
  } catch (error) {
    session.abortTransaction().then(() => {
      session.endSession();
    });

    logger.error(error);
    return res.status(422).send({ message: help.getMsLoc() });
  }
};

exports.locationByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: '導入施設が見つかりません。'
    });
  }

  Location.findById(id)
    .populate([{ path: 'municipality', select: 'name' }, { path: 'admin', select: 'name email phone first_name last_name number' }])
    .exec(function (err, location) {
      if (err) {
        logger.error(err);
        return next(err);
      } else if (!location) {
        return next(new Error('導入施設が見つかりません。'));
      }

      req.model = location;
      next();
    });
};

/** ====== PRIVATE ========= */
function getQueryAggregate(condition, isMunicipalityQuery) {
  let and_arr = [{
    deleted: false,
    $or: [
      { is_testing: null },
      { is_testing: false }
    ]
  }];

  if (condition.created_min) {
    and_arr.push({ created: { $gte: new Date(condition.created_min) } });
  }
  if (condition.created_max) {
    and_arr.push({ created: { $lte: new Date(condition.created_max) } });
  }
  if (isMunicipalityQuery) {
    and_arr.push({ municipality: new ObjectId(condition.municipalityId) });
  }

  let aggregates = [];
  aggregates.push({
    $match: {
      $and: and_arr
    }
  });

  aggregates.push({
    $lookup: {
      from: 'municipalities',
      localField: 'municipality',
      foreignField: '_id',
      as: 'municipality'
    }
  }, {
    $unwind: '$municipality'
  }, {
    $addFields: {
      municipality_name: '$municipality.name'
    }
  });

  // Match user
  let matchUser = {
    $and: [
      { 'account.deleted': { $eq: false } }
    ]
  };

  aggregates.push({
    $lookup: {
      from: 'users',
      localField: 'admin',
      foreignField: '_id',
      as: 'account'
    }
  }, {
    $unwind: '$account'
  }, {
    $match: matchUser
  }, {
    $addFields: {
      user_id: { $convert: { input: '$account._id', to: 'string' } },
      admin_email: '$account.email',
      admin_name: '$account.name',
      admin_phone: '$account.phone'
    }
  });

  let second_and_arr = [];
  if (condition.keyword && condition.keyword !== '') {
    if (!isMunicipalityQuery) {
      second_and_arr.push({ municipality_name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    }
    second_and_arr.push({ name: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
    second_and_arr.push({ admin_email: { $regex: '.*' + condition.keyword + '.*', $options: 'i' } });
  }

  if (second_and_arr.length > 0) {
    aggregates.push({
      $match: {
        $or: second_and_arr
      }
    });
  }

  aggregates.push({
    $project: {
      account: 0,
      municipality: 0
    }
  });

  const sort = help.getSortAggregate(condition);
  if (sort) {
    aggregates.push({
      $sort: sort
    });
  }

  return aggregates;
}

function abortTransaction(session) {
  if (session) {
    session.abortTransaction().then(() => {
      session.endSession();
    });
  }
}
