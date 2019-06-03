const twilio = require('twilio');
const Notify = require('../notify');
const { TWILIO_ACC_SID, TWILIO_AUTH_TOKEN } = require('../../config/environment');
const logger = require('../logger');

let twilioClient;

try {
  twilioClient = twilio(TWILIO_ACC_SID, TWILIO_AUTH_TOKEN);
} catch (err) {
  Notify.slack(`Twilio Client Creation Error: ${JSON.stringify(err)}`);
  logger.error(err);
}

module.exports = twilioClient;
