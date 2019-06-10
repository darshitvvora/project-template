/*
* Purpose: Middleware for authenticating CRONOFY service for sending calendar events
* Usage:
* const cronofyAuth = require('./components/cronofyAuth');
* app.use('/api/cronofyEvents', cronofyAuth, require('./api/cronofyEvent'));
* */


const crypto = require('crypto');

const { CRONOFY_CLIENT_SECRET_KEY } = require('../config/environment');

function cronofyAuth(req, res, next) {
  try {
    const sent = req.headers['cronofy-hmac-sha256'];

    const calculated = crypto
      .createHmac('sha256', CRONOFY_CLIENT_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('base64');

    const sentBuffer = new Buffer(sent, 'base64');
    const calculatedBuffer = new Buffer(calculated, 'base64');

    if (sentBuffer.length === calculatedBuffer.length
      && crypto.timingSafeEqual(sentBuffer, calculatedBuffer)) {
      return next();
    }

    return res.status(401).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = cronofyAuth;
