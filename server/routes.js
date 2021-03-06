/**
 * Main application routes
 */


const errors = require('./components/errors');
const path = require('path');
const { name, version } = require('../package.json');
const logger = require('./components/logger');

module.exports = function (app) {
  // Insert routes below
  app.use('/api/sessions', require('./api/session'));
  app.get('/api/health', (req, res) => res.json({ name, version }));
  // app.use('/api/things', require('./api/thing'));
  // app.use('/api/users', require('./api/user'));


  app.use(logger.transports.sentry.raven.errorHandler());

  // All undefined asset or api routes should return a 404
  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    logger.error(e);
    return (res.status(e.statusCode || e.code || 500)
      .json({ message: e.message, stack: e.stack }));
  });

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the app.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(`${app.get('appPath')}/app.html`));
    });
};
