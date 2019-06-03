import db, { Session } from '../../../sqldb';

const { APPS } = require('../../../config/buckets');

const allowedGroups = [2];

exports.checkNumberOfSessions = (req, res, next) => {
  if (!req.body.singleSession) return next();
  return db.User
    .find({
      attributes: ['id', 'group_id', 'password'],
      where: {
        $or: {
          username: req.body.username,
          email_id: req.body.username,
        },
      },
    })
    .then((user) => {
      if (!user) return next();
      if (!allowedGroups.includes(user.group_id)) return next();

      const verifyPass = user.verifyPasswordAsync(req.body.password);
      if (verifyPass instanceof Error) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'User credentials are invalid' });
      }

      if (req.body.force) {
        Object.assign(req, { user });
        return next();
      }
      return db.Session
        .findOne({
          where: {
            user_id: user.id,
            deleted_on: null,
            app_id: APPS.QUEZX_PARTNER,
          },
          attributes: ['browser', 'city', 'created_on'],
        })
        .then((session) => {
          if (session) return res.status(409).json({ error_description: 'Your account is already logged in on other device.', session });
          return next();
        });
    })
    .catch(err => next(err));
};


exports.logoutAllSessions = async (req, res, next) => {
  if (!req.body.singleSession ||
    (req.user && !allowedGroups.includes(req.user.group_id))) return next();
  if (!req.body.force) return next();
  const user = await db.User
    .find({
      attributes: ['id', 'group_id', 'password'],
      where: {
        $or: {
          username: req.body.username,
          email_id: req.body.username,
        },
      },
      raw: true,
    });

  if (!user) return next();
  if (!allowedGroups.includes(user.group_id)) return next();

  return Session
    .build({
      user_id: user.id,
    })
    .revokeTokens(db)
    .then(() => next())
    .catch(err => next(err));
};
