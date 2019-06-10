/**
 * Main application file
 */


const express = require('express');
const http = require('http');

const config = require('./config/environment');
const sqldb = require('./conn/sqldb');

// Setup server
const app = express();
const server = http.createServer(app);
/*
Enable this for enabling socket in your project
const socketio = require('socket.io')(server, {
  serveClient: config.env !== 'production',
  path: '/socket.io-client'
});
require('./config/socketio').default(socketio);
*/

require('./config/express')(app);
require('./routes')(app);
const logger = require('./components/logger');

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, () => {
    logger.log('Server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

sqldb.sequelize.sync()
  .then(startServer)
  .catch((err) => {
    logger.error('Server failed to start due to error: %s', err);
  });

// Expose app
module.exports = app;
