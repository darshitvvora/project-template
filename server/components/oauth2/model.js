/**
 * Created by Manjesh on 14-05-2016.
 */
import _ from 'lodash';
import { AccessToken, RefreshToken, AuthCode, App, User } from '../../sqldb';
import logger from '../../components/logger';

/**
 * Access Token
 * @typedef AccessToken
 * @type Object
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {Client} client
 * @property {string} scope  Options
 * @property {User} user
 */

/**
 * Returns a Access Token
 * @param bearerToken String
 * @returns { AccessToken }
 */
const cache = {};
const getAccessToken = (bearerToken) => {
  if (cache[bearerToken]) return Promise.resolve(cache[bearerToken]);
  return AccessToken
    .findOne({
      where: { access_token: bearerToken },
      attributes: [['access_token', 'accessToken'], ['expires', 'accessTokenExpiresAt'], 'scope'],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'client_id', 'group_id', 'email_id', 'admin_flag'],
        }, {
          model: App,
          attributes: ['id'],
        },
      ],
    })
    .then((accessToken) => {
      if (!accessToken) return false;
      const token = accessToken.toJSON();
      token.user = token.User;
      token.client = token.App;
      token.scope = token.scope;
      cache[bearerToken] = token;
      return token;
    })
    .catch(logger.error);
};


function getClient(clientId, clientSecret) {
  const options = {
    where: { client_id: clientId },
    attributes: ['id', 'client_id', 'redirect_uri'],
  };
  if (clientSecret) options.where.client_secret = clientSecret;
  const log = console;

  return App
    .findOne(options)
    .then((client) => {
      if (!client) return new Error('client not found');
      const clientWithGrants = client.toJSON();
      clientWithGrants.grants = ['authorization_code', 'password',
        'refresh_token', 'client_credentials'];
      // Todo: need to create another table for redirect URIs
      clientWithGrants.redirectUris = [clientWithGrants.redirect_uri];
      delete clientWithGrants.redirect_uri;
      // clientWithGrants.refreshTokenLifetime = integer optional
      // clientWithGrants.accessTokenLifetime  = integer optional
      return clientWithGrants;
    }).catch(err => log.log('getClient - Err: ', err));
}

// Or, returning a promise.
function getUser(username, password) {
  return User
    .findOne({
      where: { username },
      attributes: ['id', 'name', 'client_id', 'group_id', 'email_id', 'password', 'admin_flag'],
    })
    .then(user => user.verifyPasswordAsync(password))
    .catch(logger.error);
}

/**
 *
 * @param code
 * @returns {*} expiresAt
 */

const revokeAuthorizationCode = code =>
  AuthCode.findOne({
    where: {
      auth_code: code.code,
    },
  }).then(() => {
    // if(rCode) rCode.destroy();
    /** *
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    const expiredCode = code;
    expiredCode.expiresAt = new Date('2015-05-28T06:59:53.000Z');
    return expiredCode;
  }).catch(logger.error)
  // return code
  // return RefreshToken.findOne({
  //  where:{
  //    refresh_token: token.refreshToken
  //  }
  // }).then(rT => {
  //  if(rT) rT.destroy();
  //  /***
  //   * As per the discussion we need set older date
  //   * revokeToken will expected return a boolean in future version
  //   * https://github.com/oauthjs/node-oauth2-server/pull/274
  //   * https://github.com/oauthjs/node-oauth2-server/issues/290
  //   */
  //  const expiredToken = token
  //  expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
  //  return expiredToken
  // })
;

/**
 * RefreshToken as param to revokeToken - got from getRefreshToken()
 * @typedef RefreshTokenforRevokeToken
 * @type Object
 * @property {string} refreshToken
 * @property {string} refresh_token  - Proxy to refreshToken
 * @property {Date} refreshTokenExpiresAt - Optional
 * @property {Client} client
 * @property {User} user
 */

/**
 *
 * @param {RefreshTokenforRevokeToken} token
 * @returns {*}
 */

const revokeToken = token => RefreshToken
  .findOne({
    where: {
      refresh_token: token.refreshToken,
    },
  }).then((rT) => {
    if (rT) rT.destroy();
    /** *
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    const expiredToken = token;
    expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z');
    return expiredToken;
  }).catch(logger.error);

/**
 * SavedAccessToken
 * @typedef SavedAccessToken
 * @type Object
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {Client} client
 * @property {string} scope  Optional
 * @property {string} refreshToken optional
 * @property {Date} refreshTokenExpiresAt optional
 * @property {User} user
 */

/**
 * TokenToSave
 * @typedef TokenToSave
 * @type Object
 * @property {string} accessToken
 * @property {Date} accessTokenExpiresAt
 * @property {string} refreshToken
 * @property {Date} refreshTokenExpiresAt
 * @property {string} scope
 */

/**
 * Client Object as Parameter to SaveToken()
 * @typedef ClientAsParam
 * @type Object
 * @property {number} id
 * @property {string} client_id
 * @property {Array} grants - Array of OAuth grants allowed for the client
 * @property {Array} redirectUris - Array of redirectURIs allowed
 * @property {Date} refreshTokenExpiresAt
 * @property {string} scope
 * We can add extra fields while returning from getClient()
 */

/**
 * User Object as Parameter to SaveToken()
 * @typedef UserAsParam
 * @type Object
 * @property {number} id
 * @property {string} username
 * @property {Array} password
 * As per need We can add extra fields while returning from getUser()
 */

/**
 * Returns Saved AccessToken
 * @param {TokenToSave} token
 * @param {ClientAsParam} client
 * @param user
 * @returns {Promise.<T>|*}
 */


function saveToken(token, client, user) {
  return Promise.all([
    AccessToken.create({
      access_token: token.accessToken,
      expires: token.accessTokenExpiresAt,
      app_id: client.id,
      user_id: user.id,
      scope: token.scope || '',
    }),
    token.refreshToken ? RefreshToken.create({ // no refresh token for client_credentials
      refresh_token: token.refreshToken,
      expires: token.refreshTokenExpiresAt,
      app_id: client.id,
      user_id: user.id,
      scope: token.scope || '',
    }) : [],

  ])
    .then(() => _.assign( // expected to return client and user, but not returning
      {
        client,
        user,
        access_token: token.accessToken, // proxy
        refresh_token: token.refreshToken, // proxy
        expires_in: 3600, // Todo: temporary fix
        token_type: 'bearer', // Todo: temporary fix
      },
      token,
    ))
    .catch(logger.error);
}

/**
 * RefreshToken returning from  getRefreshToken()
 * @typedef getAuthorizationCodeReturn
 * @type Object
 * @property {Client} client
 * @property {Date} expiresAt
 * @property {string} redirectUri - Optional
 * @property {User} user
 */

/** *
 *
 * @param {string} code
 * @returns  * @returns {Promise.<getAuthorizationCodeReturn>|*}
 */

function getAuthorizationCode(code) {
  return AuthCode
    .findOne({
      attributes: [['app_id', 'client_id'], 'expires', ['user_id', 'user_id'], 'scope'],
      where: { auth_code: code },
      include: [{
        model: User,
        attributes: ['id'],
      }, {
        model: App,
        attributes: ['id'],
      }],
    })
    .then((authCodeModel) => {
      if (!authCodeModel) return false;
      const client = authCodeModel.App.toJSON();
      const user = authCodeModel.User.toJSON();
      return {
        code,
        client,
        expiresAt: authCodeModel.expires,
        redirectUri: client.redirect_uri,
        user,
        scope: authCodeModel.scope || '',
      };
    })
    .catch(logger.error);
}

function saveAuthorizationCode(code, client, user) {
  return AuthCode
    .create({
      expires: code.expiresAt,
      app_id: client.id,
      auth_code: code.authorizationCode,
      user_id: user.id,
      scope: code.scope,
    })
    .then(() => _.assign({ code: code.authorizationCode }, code))
    .catch(logger.error);
}
/**
 *
 * @param {Client} client returned from getClient()
 * @returns {*}
 */

function getUserFromClient(client) {
  const options = {
    where: { client_id: client.client_id },
    include: [{
      model: User,
      attributes: ['id'],
    }],
    attributes: ['id', 'client_id', 'redirect_uri'],
  };
  if (client.client_secret) options.where.client_secret = client.client_secret;

  return App
    .findOne(options)
    .then((rClient) => {
      if (!rClient) return false;
      if (!rClient.User) return false;
      return rClient.User.toJSON();
    }).catch(logger.error);
}


/**
 * RefreshToken returning from  getRefreshToken()
 * @typedef RefreshTokenReturn
 * @type Object
 * @property {string} refreshToken
 * @property {Client} client
 * @property {Date} refreshTokenExpiresAt - Optional
 * @property {string} scope - Optional
 * @property {User} user
 */


/**
 * Returns a RefreshToken Object
 * @param {string} token
 * @returns {RefreshTokenReturn}
 */

const getRefreshToken = (refreshToken) => {
  if (!refreshToken || refreshToken === 'undefined') return false;

  return RefreshToken
    .findOne({
      attributes: [['app_id', 'client_id'], 'user_id', 'expires'],
      where: { refresh_token: refreshToken },
      include: [{
        model: App,
        attributes: ['id'],
      }, {
        model: User,
        attributes: ['id'],
      }],

    })
    .then((savedRT) => {
      const tokenTemp = {
        user: savedRT ? savedRT.User.toJSON() : {},
        client: savedRT ? savedRT.App.toJSON() : {},
        refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
        refreshToken,
        refresh_token: refreshToken,
        scope: savedRT.scope,
      };
      return tokenTemp;
    }).catch(logger.error);
};

const validateScope = (token, scope) => token.scope === scope;


module.exports = {
  // generateAccessToken, optional - used for jwt
  // generateAuthorizationCode, optional
  // generateRefreshToken, - optional
  getAccessToken,
  getAuthorizationCode, // getAuthCode renamed to,
  getClient,
  getRefreshToken,
  getUser,
  getUserFromClient,
  // grantTypeAllowed, Removed in oauth2-server 3.0
  revokeAuthorizationCode,
  revokeToken,
  saveToken, // saveAccessToken, renamed to
  saveAuthorizationCode, // renamed saveAuthCode,
  validateScope,
};
