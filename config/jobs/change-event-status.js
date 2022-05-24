'use strict';

var mongoose = require('mongoose'),
  Event = mongoose.model('Event'),
  Comproject = mongoose.model('Comproject'),
  Participant = mongoose.model('Participant'),
  Point = mongoose.model('Point'),
  PointLog = mongoose.model('PointLog'),
  User = mongoose.model('User'),
  path = require('path'),
  moment = require('moment-timezone'),
  EVENT_STATUS = require(path.resolve('./modules/core/server/shares/constants')).EVENT_STATUS,
  logger = require(path.resolve('./modules/core/server/controllers/logger.server.controller')),
  helper = require(path.resolve('./modules/core/server/controllers/help.server.controller')),
  constants = require(path.resolve('./modules/core/server/shares/constants')),
  simulationServerController = require(path.resolve('./modules/core/server/controllers/simulation.server.controller')),
  rankServerController = require(path.resolve('./modules/core/server/controllers/rank.server.controller')),
  notificationServerUtil = require(path.resolve('./modules/core/server/utils/notification.server.util'));

moment.tz.setDefault('Asia/Tokyo');
moment.locale('ja');

exports.execute = function () {
  change_event_status();
};

async function change_event_status() {
  let session = null;
  try {
    console.info('Runing job: change_event_status');
    const current = new Date();
    const condition = {
      deleted: false,
      $or: [
        { status: EVENT_STATUS.PREPARING },
        { status: EVENT_STATUS.OPENING }
      ]
    };

    const events = await Event.find(condition).lean();
    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      if (event.status === EVENT_STATUS.PREPARING) {
        if (event.start && event.start <= current) {
          session = await mongoose.startSession();
          session.startTransaction();

          await Event.updateOne({ _id: event._id }, { status: EVENT_STATUS.OPENING }, { session });
          await Comproject.updateMany({ event: event._id, deleted: false }, { status: EVENT_STATUS.OPENING }, { session });

          await session.commitTransaction();
          session.endSession();
          try {
            // Push silent notification
            let companyId = event.company;
            const users = await User.find({ deleted: false, roles: constants.ROLE.EMPLOYEE, company: companyId }).select('_id').lean();
            const userIds = users.map(item => item._id);
            if (userIds && userIds.length > 0) {
              notificationServerUtil.sendSilentEventOpeningOrPreparing(userIds);
            }
          } catch (error) {
            logger.error('Push silent notification for event start error:');
            logger.error(error);
          }
        }
      } else if (event.status === EVENT_STATUS.OPENING) {
        if (event.end && event.end <= current) {
          // 1. Calculate total for event
          // 2. Calculate total for comproject
          // 3. Create point record + point log for user
          // 4. Remove comproject_joining in User table

          session = await mongoose.startSession();
          session.startTransaction();

          let comprojectsOfEvent = await Comproject.find({ deleted: false, event: event._id }).select('_id project municipality').populate({ path: 'project', select: 'name' });
          const comprojectIds = comprojectsOfEvent.map(item => item._id);
          const getParticipantsPromises = comprojectIds.map(comprojectId => {
            return Participant.find({ deleted: false, comproject: comprojectId });
          });
          const arrayOfParticipants = await Promise.all(getParticipantsPromises);

          let totalAmountOfEvent = 0;
          for (const [index, participants] of arrayOfParticipants.entries()) {
            const totalOfComproject = participants.reduce((sum, item) => {
              return sum + item.amount;
            }, 0);
            const stepsOfComproject = participants.reduce((sum, item) => {
              return sum + item.steps;
            }, 0);
            comprojectsOfEvent[index].totalOfComproject = totalOfComproject;
            comprojectsOfEvent[index].stepsOfComproject = stepsOfComproject;
            totalAmountOfEvent += totalOfComproject;

            // 3
            const expire = new Date(new Date().setMonth(new Date().getMonth() + 6)); // 6 months later;
            const pointObjects = participants.map(item => {
              const points = Math.floor(item.point);
              return {
                user: item.user,
                project: comprojectsOfEvent[index].project._id,
                comproject: comprojectsOfEvent[index]._id,
                municipality: comprojectsOfEvent[index].municipality,
                participant: item._id,
                points: points,
                expire: expire
              };
            });
            await Point.insertMany(pointObjects, { session });
            const pointLogObjects = participants.map(item => {
              const points = Math.floor(item.point);
              return {
                user: item.user,
                type: constants.POINT_LOG_TYPE.ACQUISITION,
                points: points,
                project: comprojectsOfEvent[index].project._id,
                municipality: comprojectsOfEvent[index].municipality
              };
            });
            await PointLog.insertMany(pointLogObjects, { session });

            // Send notification
            try {
              const userIds = participants.map(item => item.user);
              if (userIds && userIds.length > 0) {
                notificationServerUtil.sendEventEnd(userIds, comprojectsOfEvent[index].project.name);
              }
            } catch (error) {
              logger.error(error);
            }
          }

          if (event.type === constants.EVENT_TYPE.FLOATING) {
            // if set min_donation_amount: check totalAmountOfEvent
            if (event.min_donation_amount && totalAmountOfEvent < event.min_donation_amount) {
              const isAllStepsOfComproject0 = isAllStepsOfComprojectZero(comprojectsOfEvent);
              if (isAllStepsOfComproject0) {
                const rate = 1 / comprojectsOfEvent.length;
                // 2 + 4
                for (const comproject of comprojectsOfEvent) {
                  await User.updateMany({ deleted: false, comproject_joining: comproject._id }, { comproject_joining: null }, { session });

                  const realityTotal = comproject.totalOfComproject;
                  const total = simulationServerController.calculateTotal(event.min_donation_amount, rate);
                  await Comproject.updateOne({ _id: comproject._id }, { status: EVENT_STATUS.FINISHED, total: total, reality_total: realityTotal }, { session });
                }
              } else {
                // 2 + 4
                const stepsOfEvent = comprojectsOfEvent.reduce((sum, item) => {
                  return sum + item.stepsOfComproject;
                }, 0);
                for (const comproject of comprojectsOfEvent) {
                  await User.updateMany({ deleted: false, comproject_joining: comproject._id }, { comproject_joining: null }, { session });

                  const rate = comproject.stepsOfComproject / stepsOfEvent;
                  const realityTotal = comproject.totalOfComproject;
                  const total = simulationServerController.calculateTotal(event.min_donation_amount, rate);
                  await Comproject.updateOne({ _id: comproject._id }, { status: EVENT_STATUS.FINISHED, total: total, reality_total: realityTotal }, { session });
                }
              }

              // 1
              await Event.updateOne({ _id: event._id }, { status: EVENT_STATUS.FINISHED, total: event.min_donation_amount, reality_total: totalAmountOfEvent }, { session });
            } else if (event.max_donation_amount && totalAmountOfEvent >= event.max_donation_amount) {
              // 2 + 4
              const stepsOfEvent = comprojectsOfEvent.reduce((sum, item) => {
                return sum + item.stepsOfComproject;
              }, 0);
              for (const comproject of comprojectsOfEvent) {
                await User.updateMany({ deleted: false, comproject_joining: comproject._id }, { comproject_joining: null }, { session });

                const rate = comproject.stepsOfComproject / stepsOfEvent;
                const realityTotal = comproject.totalOfComproject;
                const total = simulationServerController.calculateTotal(event.max_donation_amount, rate);
                await Comproject.updateOne({ _id: comproject._id }, { status: EVENT_STATUS.FINISHED, total: total, reality_total: realityTotal }, { session });
              }

              // 1
              await Event.updateOne({ _id: event._id }, { status: EVENT_STATUS.FINISHED, total: event.max_donation_amount, reality_total: totalAmountOfEvent }, { session });
            } else {
              // 2 + 4
              for (const comproject of comprojectsOfEvent) {
                await User.updateMany({ deleted: false, comproject_joining: comproject._id }, { comproject_joining: null }, { session });
                await Comproject.updateOne({ _id: comproject._id }, { status: EVENT_STATUS.FINISHED, total: comproject.totalOfComproject }, { session });
              }

              // 1
              await Event.updateOne({ _id: event._id }, { status: EVENT_STATUS.FINISHED, total: totalAmountOfEvent }, { session });
            }
          } else {
            // fixed
            let allParticipantsOfEvent = arrayOfParticipants.reduce((allParticipantsOfEvent, participants) => {
              return allParticipantsOfEvent.concat(participants);
            }, []);
            const stepsOfEvent = allParticipantsOfEvent.reduce((sum, item) => {
              return sum + item.steps;
            }, 0);

            let updateParticipantsPromises = [];
            // eslint-disable-next-line no-loop-func
            allParticipantsOfEvent = allParticipantsOfEvent.map(item => {
              const rate = item.steps / stepsOfEvent;
              item.amount = simulationServerController.calculateTotal(event.donation_amount, rate);

              updateParticipantsPromises.push(Participant.updateOne({ _id: item._id }, { amount: item.amount }, { session }));
              return item;
            });

            await Promise.all(updateParticipantsPromises);

            // 2 + 4
            for (const comproject of comprojectsOfEvent) {
              const participantsOfComproject = allParticipantsOfEvent.filter(item => item.comproject.toString() === comproject._id.toString());
              const totalOfComproject = participantsOfComproject.reduce((total, participant) => {
                return total + participant.amount;
              }, 0);

              await User.updateMany({ deleted: false, comproject_joining: comproject._id }, { comproject_joining: null }, { session });
              await Comproject.updateOne({ _id: comproject._id }, { status: EVENT_STATUS.FINISHED, total: totalOfComproject }, { session });
            }

            // 1
            await Event.updateOne({ _id: event._id }, { status: EVENT_STATUS.FINISHED, total: event.donation_amount }, { session });
          }

          await session.commitTransaction();
          session.endSession();
        }

        // in case over 7 days but no data from app, auto calculate rank_growth_rate
        if (!event.is_cal_rank_growth_rank) {
          const isStartedOver7Days = helper.isEventStartedOver7Days(event.start);
          if (isStartedOver7Days) {
            const comproject = await Comproject.findOne({ deleted: false, event: event._id });
            if (comproject) {
              rankServerController.recalculateRanksForComproject(comproject._id, event.company);
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    abortTransaction();
    logger.error(error);
    return false;
  }

  function abortTransaction() {
    if (session) {
      session.abortTransaction().then(() => {
        session.endSession();
      });
    }
  }

  function isAllStepsOfComprojectZero(comprojects) {
    const positive = comprojects.find(item => item.stepsOfComproject);
    return !Boolean(positive);
  }
}
