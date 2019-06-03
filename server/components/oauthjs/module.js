
import model from './index';

module.exports = require('oauth2-server')({
  model,
  refreshTokenLifetime: 60 * 24 * 3600, // 60 days
  accessTokenLifetime: 30 * 60, // 30 mins
  grants: ['authorization_code', 'password', 'refresh_token', 'client_credentials'],
  debug: false,
});
