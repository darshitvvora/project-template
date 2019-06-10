/*
* Purpose: Middleware for cron auth from key in
* environment variable (.env) grant type authentication
* Usage:
* const { cronAuth } = require('../../components/cronAuth');
* router.get('/clientCrons', cronAuth(), controller.clients);
* */


const config = require('../config/environment');

function cronAuth() {
  return (req, res, next) => {
    if (req.query.token && req.query.token === config.CRON_TOKEN) {
      return next();
    }
    return res.status(401).end();
  };
}

module.exports = cronAuth;

