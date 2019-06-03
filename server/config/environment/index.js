'use strict';
/*eslint no-process-env:0*/

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const _ = require('lodash');

// All configurations will extend these options
// ============================================

const root = path.normalize(`${__dirname}/../../..`);
if (!fs.existsSync(path.join(root, '.env'))) {
  fs.writeFileSync(path.join(root, '.env'), fs.readFileSync(path.join(root, '.env.sample')));
}

const env = dotenv.config({ path: path.join(root, '.env') });
const IS_DEV = env.NODE_ENV === 'development';
const { DOMAIN, PREFIX, GOOGLE_CLIENT_ID } = env;

const all = {
  env: env.NODE_ENV,

  // Root path of server
  root,

  // Browser-sync port
  browserSyncPort: process.env.BROWSER_SYNC_PORT || 3000,

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  URLS: {
    SLACK: process.env.URLS_SLACK,
    QNOTIFY_SERVER: process.env.URLS_QNOTIFY_SERVER,
  },

  // Should we populate the DB with sample data?
 // seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'Wndh34Njdn4n$ds'
  },

  /*// MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },
*/
  google: {
    clientID: process.env.GOOGLE_ID || 'id',
    clientSecret: process.env.GOOGLE_SECRET || 'secret',
    callbackURL: `${process.env.DOMAIN || ''}/auth/google/callback`
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  env,
  require('./shared'),
  require(`./${process.env.NODE_ENV}.js`) || {});
