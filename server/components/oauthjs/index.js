import debug from 'debug';
import useragent from 'useragent';
import geoip from 'geoip-lite';

import cache from '../../conn/cache';
import config from '../../config/environment';
import QueryError from '../../components/errors/query-error';
import { App, User, AccessToken, AuthCode, RefreshToken, Session,
  QueuedTask, Client } from '../../sqldb';

import { userGameEventLoggerByName } from '../../components/log';

const log = debug('q.components.oauthjs');

const oAuthModel = {
  revokeToken(token) {
    return AccessToken
      .find({
        where: {
          access_token: token,
          created_at: { $gt: new Date('2017-03-23') },
        },
        attributes: ['session_id', 'user_id'],
      })
      .then((accessToken) => {
        log('accessToken', accessToken);
        if (!accessToken) return Promise.resolve({ message: 'no tokens found.' });
        if (!accessToken.session_id) return Promise.resolve({ message: 'no session_id' });
        const { session_id, user_id } = accessToken;
        const expires = new Date();
        return Promise.all([
          AccessToken.update(
            { expires },
            { where: { user_id, session_id } },
          ),
          RefreshToken.update(
            { expires },
            { where: { user_id, session_id } },
          ),
          Session.update(
            { deleted_on: expires },
            { where: { id: session_id } },
          ),
        ]);
      });
  },
  getAccessToken(bearerToken, callback) {
    if (config.OAUTH_CACHE === 'true'
      && cache[bearerToken]) return callback(null, cache[bearerToken]);
    return AccessToken
      .findOne({
        where: { access_token: bearerToken },
        attributes: ['access_token', 'expires', 'session_id', 'app_id'],
        include: [
          {
            model: User.scope('active'),
            attributes: ['id', 'name', 'client_id', 'group_id', 'email_id',
              'admin_flag', 'prescreen', 'username'],
          },
        ],
      })
      .then((accessToken) => {
        if (!accessToken) return callback(null, false);
        const token = accessToken.toJSON();
        token.user = token.User;
        delete token.User;
        cache[bearerToken] = token;
        callback(null, token);
        return accessToken;
      })
      .catch(callback);
  },

  // serialize App accessing api
  getClient(clientId, clientSecret, callback) {
    const options = {
      where: { client_id: clientId },
      attributes: ['id', ['client_id', 'clientId'], ['redirect_uri', 'redirectUri']],
    };
    if (clientSecret) options.where.client_secret = clientSecret;

    App
      .findOne(options)
      .then((client) => {
        if (!client) return callback(null, false);
        callback(null, client.toJSON());
        return client;
      })
      .catch(callback);
  },

  grantTypeAllowed(clientId, grantType, callback) {
    callback(null, true);
  },

  getUserFromClient(clientId, clientSecret, cb) {
    const options = {
      where: { client_id: clientId },
      include: [{
        model: User.scope('active'),
        attributes: ['id', 'name', 'client_id', 'group_id', 'email_id', 'password', 'admin_flag'],
      }],
      attributes: ['id', 'client_id', 'redirect_uri'],
    };
    if (clientSecret) options.where.client_secret = clientSecret;

    return App
      .findOne(options)
      .then((client) => {
        if (!client || !client.User) return cb(null, false);
        cb(null, client.User.toJSON());
        return client;
      }).catch(cb);
  },

  saveAccessToken(accessToken, client, expires, user, sessionId, callback) {
    userGameEventLoggerByName('Login', user);
    return AccessToken
      .build({ expires })
      .set('app_id', client.id)
      .set('access_token', accessToken)
      .set('user_id', user.id)
      .set('session_id', sessionId)
      .save()
      .then(token => callback(null, token))
      .catch(callback);
  },

  saveSession(req, cb) {
    const ua = req.headers['user-agent'];

    const agent = useragent.parse(ua);
    const { id: userId, group_id: groupId } = req.user;
    const session = { user_id: userId, group_id: groupId, app_id: req.oauth.client.id };

    if (agent) {
      Object.assign(session, {
        browser: agent.toAgent(),
        os: agent.os.toString(),
        device: agent.device.toString(),
      });
    }

    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0];

    session.ip = ip;
    const geo = geoip.lookup(ip);
    if (geo) {
      const { country, region, city, ll, metro, zip } = geo;
      const [latitude, longitude] = ll;
      Object.assign(session, { latitude,
        longitude,
        country,
        region,
        city,
        metro,
        zip,
      });
    }

    return Session.create(session)
      .then((saved) => {
        cb(null, saved.toJSON());
        return saved;
      })
      .catch(cb);
  },

  getAuthCode(authCode, callback) {
    AuthCode
      .findOne({
        where: { auth_code: authCode },
        attributes: [['app_id', 'clientId'], 'expires', ['user_id', 'userId'], 'session_id'],
      })
      .then((authCodeModel) => {
        if (!authCodeModel) return callback(null, false);
        callback(null, authCodeModel.toJSON());
        return authCodeModel;
      })
      .catch(callback);
  },

  saveAuthCode(authCode, client, expires, user, sessionId, callback) {
    log('saveAuthCode: ', authCode);
    return AuthCode
      .build({ expires })
      .set('app_id', client.id)
      .set('auth_code', authCode)
      .set('user_id', user.id)
      .set('session_id', sessionId)
      .save()
      .then(code => callback(null, code))
      .catch(callback);
  },

  getUser(username, password, callback) {
    log('getUser', { username, password });
    const where = { $or: { username, email_id: username } };
    if (config.env === 'test') where.$or.id = username;
    return User.scope('active')
      .findOne({
        where,
        attributes: ['id', 'name', 'client_id', 'group_id', 'email_id', 'password', 'admin_flag'],
      })
      .then((user) => {
        if (!user) return callback(null, false);

        if (config.env === 'test') return callback(null, user.toJSON());
        // Send mail for client login
        return user.verifyPassword(password, (err, verifiedUser) => {
          if (err) return callback(null, false);
          if (verifiedUser.group_id === 5) {
            Client.findById(user.client_id, {
              attributes: ['name'],
              include: [
                {
                  model: User,
                  as: 'EngagementManager',
                  attributes: ['email_id'],
                },
              ],
            })
              .then(client => QueuedTask.clientLoginNotify({ user, client }))
              .catch(new QueryError('Client Login Notify Error!'));
          }

          return callback(null, verifiedUser);
        });
      })
      .catch(callback);
  },

  saveRefreshToken(refreshToken, client, expires, user, sessionId, callback) {
    return RefreshToken
      .build({ expires })
      .set('app_id', client.id)
      .set('refresh_token', refreshToken)
      .set('user_id', user.id)
      .set('session_id', sessionId)
      .save()
      .then(token => callback(null, token))
      .catch(callback);
  },

  getRefreshToken(refreshToken, callback) {
    return RefreshToken
      .findOne({
        where: { refresh_token: refreshToken },
        attributes: [['app_id', 'clientId'], ['user_id', 'userId'], 'expires', 'session_id'],

        // only non suspended users should be allowed to refresh token
        include: [{ model: User.scope('active'), attributes: ['id'] }],
      })
      .then((refreshTokenModel) => {
        if (!refreshTokenModel) return callback(null, false);
        callback(null, refreshTokenModel.toJSON());
        return null;
      })
      .catch(callback);
  },

  generateToken(type, req, callback) {
    // reissue refreshToken if grantType is refresh_token
    if (type === 'refreshToken' && req.body.grant_type === 'refresh_token') {
      return callback(null, { refreshToken: req.body.refresh_token });
    }

    return callback(null, false);
  },
};

export default oAuthModel;
