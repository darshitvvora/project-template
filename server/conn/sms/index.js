/*
* Purpose: Used to send sms
* Usage:
const { sms } = require('../../../conn/sms');
const message = [
        'Hello,\n\n',
        'You asked us to send you a magic link for quickly signing in to your platform.\n\n',
        `${shortURL}`,
      ].join('');

      sms({ number: '99545445445', message });
* */

const strip = require('strip');

const rp = require('request-promise');
const { SMS_URL, SMS_ENDPOINT, SMS_USER_NAME, SMS_PASSWORD } = require('../../config/environment');

function formatSMSData(data) {
  return {
    routesms: {
      username: SMS_USER_NAME,
      password: SMS_PASSWORD,
      type: 0,
      dlr: 1,
      destination: data.number,
      source: 'QUEZEX',
      message: strip(data.message),
      rand: Math.random(),
    },
    gupshup: {
      userid: SMS_USER_NAME,
      password: SMS_PASSWORD,
      method: 'SendMessage',
      send_to: data.number,
      msg: strip(data.message),
      msg_type: 'TEXT',
      auth_scheme: 'plain',
      v: '1.1',
      format: 'text',
      mask: 'QUEZEX',
    },
  }[SMS_ENDPOINT];
}

function sms(data) {
  const uri = SMS_URL;
  const qs = formatSMSData(data);

  return rp({ uri, qs });
}

module.exports = { sms };
