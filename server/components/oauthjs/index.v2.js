
import { App, User, AccessToken, Client, ClientGroup, Product } from '../../sqldb';
import config from '../../config/environment';
import cache from '../../conn/cache';

import { revokeToken,
  saveSession,
  getClient,
  grantTypeAllowed,
  saveAccessToken,
  getAuthCode,
  saveToken,
  saveAuthCode,
  saveRefreshToken,
  getRefreshToken,
  generateToken } from './index';

module.exports = require('oauth2-server')({
  model: {
    revokeToken,
    getAccessToken: function getAccessToken(bearerToken, callback) {
      if (config.OAUTH_CACHE === 'true'
        && cache[bearerToken]) return callback(null, cache[bearerToken]);
      return AccessToken
        .findOne({
          where: { access_token: bearerToken },
          attributes: ['access_token', 'expires', 'app_id', 'session_id'],
          include: [{
            model: App,
            attributes: ['id', 'group_id'],
          }, {
            model: User.scope('active'),
            attributes: ['id', 'name', 'client_id', 'group_id', 'email_id',
              'admin_flag', 'prescreen', 'username'],
            include: [{
              model: Client,
              attributes: ['id'],
              include: [{
                model: ClientGroup,
                attributes: ['id', 'client_id', 'group_id'],
              }],
            }],
          }],
        })
        .then((accessToken) => {
          if (!accessToken) return callback(null, false);
          const { access_token, expires, session_id, app_id, User: u,
            App: { group_id: gid } } = accessToken.toJSON();
          const { Client: { ClientGroups } } = u;
          if (!ClientGroups.length || !ClientGroups.map(x => x.group_id)
            .concat(1).includes(gid)) {
            return callback('insufficient_scope', false);
          }
          const user = Object.assign(u, ((gid === 1)
            ? {} : { group_id: gid }));
          delete user.Client;
          cache[bearerToken] = { access_token, expires, app_id, session_id, user };
          return callback(null, cache[bearerToken]);
        })
        .catch(callback);
    },
    getClient,
    grantTypeAllowed,
    saveAccessToken,
    saveSession,
    getAuthCode,
    saveToken,
    saveAuthCode,
    getUser(username, password, callback) {
      return User.scope('active')
        .findOne({
          where: { username },
          attributes: ['id', 'name', 'client_id', 'group_id', 'email_id', 'password', 'admin_flag'],
          include: [{
            model: Client,
            include: Product,
          }],
        })
        .then(user => user.verifyPassword(password, callback))
        .catch(callback);
    },
    saveRefreshToken,
    getRefreshToken,
    generateToken,
  },
  grants: ['authorization_code', 'password', 'refresh_token', 'client_credentials'],
  debug: false,
});
