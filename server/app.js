/**
 * Main application file
 */

'use strict';

const express = require('express');
const http = require('http');
const sqldb = require('./config/sqldb');
const config = require('./config/environment');
const seedDatabaseIfNeeded = require('./config/seed');

// Setup server
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io')(server, {
  serveClient: config.env !== 'production',
  path: '/socket.io-client'
});
require('./config/socketio').default(socketio);
require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

sqldb.sequelize.sync()
  .then(seedDatabaseIfNeeded)
  .then(startServer)
  .catch(function(err) {
    console.log('Server failed to start due to error: %s', err);
  });

// Expose app
exports = module.exports = app;
