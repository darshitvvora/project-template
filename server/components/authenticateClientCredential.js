/*
* Purpose: Middleware for clientCredential grant type authentication
* Usage:
* const { authenticateClientCredential } = require('../../components/authenticateClientCredential');
* router.get('/clients', authenticateClientCredential(), clients.index);
* */

const config = require('../config/environment');

function authenticateClientCredential() {
  return (req, res, next) => {
    req.clientCredAuth = true;
    if (req.method === 'GET') {
      if (req.query.clientKey && config[req.query.clientKey] === req.query.clientSecret) {
        req.user = JSON.parse(req.query.user || {});
        return next();
      }
    } else if (req.body.clientKey && config[req.body.clientKey] === req.body.clientSecret) {
      req.user = req.body.user || {};
      return next();
    }

    return res.sendStatus(401);
  };
}

module.exports = authenticateClientCredential;
