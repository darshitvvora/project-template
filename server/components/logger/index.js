/*
* Purpose: Use to logging in Sentry, File and Console
* Usage:
* const logger = require('./logger')
export async function test(id) {
  try {
    // your code here
    const testxyz = await test1();
  } catch (e) {
    logger.error(e);
  }
}
* */


const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const Sentry = require('winston-raven-sentry');

const { NODE_ENV, SENTRY_DSN, root } = require('../../config/environment');

const logger = new winston.Logger({
  transports: [
    new DailyRotateFile({
      name: 'error-file',
      datePattern: '.yyyy-MM-dd.log',
      filename: `${root}/logs/error`,
    }),
    new Sentry({
      dsn: NODE_ENV === 'production' && SENTRY_DSN,
      install: true,
      config: { environment: NODE_ENV, release: '@@_RELEASE_' },
      level: 'warn',
    }),
    new (winston.transports.Console)({
      name: 'console',
      level: 'debug',
      silent: NODE_ENV === 'production',
    }),
  ],
});

module.exports = logger;
