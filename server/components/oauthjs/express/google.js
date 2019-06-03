import rp from 'request-promise';
import env from '../../../config/environment';
import logger from '../../../components/logger';
import db from '../../../sqldb';

const { OAuth2Client } = require('google-auth-library');


export function login(req, res) {
  const scope = `${env.auth.google.availableScopes.basic} ${env.auth.google.availableScopes[req.query.scope]}`;
  const path = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=${scope}&access_type=offline&redirect_uri=${env.auth.google.redirect_uri}&client_id=${env.auth.google.client_id}&include_granted_scopes=true&state=${req.query.continue}`;
  res.writeHead(302, { Location: path });
  return res.end();
}

function storeTheGoogleToken(gToken, email) {
  db.User.findOne({
    where: {
      email_id: email,
    },
    raw: true,
    attributes: ['id'],
  }).then((user) => {
    if (user) {
      db.UserGoogleToken.upsert({
        user_id: user.id,
        access_token: gToken.access_token,
        token_type: gToken.token_type,
        refresh_token: gToken.refresh_token,
        user_google_tokens: gToken.id_token,
      }, { user_id: user.id });
    }
  }).catch((err) => {
    logger.error('err == ', err);
  });
}

export function oauth(req, res, next) {
  if (req.body.grant_type !== 'google') return next();
  return rp({
    method: 'POST',
    uri: 'https://www.googleapis.com/oauth2/v4/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: {
      grant_type: 'authorization_code',
      redirect_uri: env.auth.google.redirect_uri,
      client_id: env.auth.google.client_id,
      client_secret: env.auth.google.client_secret,
      code: req.body.code,
    },
    json: true,
  })
    .then(token =>
      Promise.all(
        [
          token,
          rp({
            method: 'GET',
            uri: 'https://www.googleapis.com/plus/v1/people/me',
            headers: { Authorization: `Bearer ${token.access_token}` },
            json: true,
          }),
        ],
      ),
    )
    .then(([gToken, user]) => {
      logger.log('DETAILS', { gToken, user });
      const { emails } = user;
      const email = emails.filter(x => (x.type === 'account'))[0].value;
      req.body.grant_type = 'password';
      req.body = { username: email, password: env.CRON_TOKEN };
      logger.log('AFTER GOOGLE LOGIN', req.body);
      storeTheGoogleToken(gToken, email);
      return next();
    })
    .catch((err) => {
      logger.error('error while google login', err);
      return res.status(400).json(err);
    });
}


export async function android(req, res, next) {
  if (req.body.grant_type !== 'google-id-token-mobile') return next();

  const CLIENT_ID = env.GOOGLE_CLIENT_ID;
  const client = new OAuth2Client(CLIENT_ID);
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.code,
      audience: CLIENT_ID,
    });
    const { email } = ticket.getPayload();
    req.body = { grant_type: 'password', username: email, password: env.CRON_TOKEN };
    return next();
  } catch (err) {
    logger.error('error while google login', err);
    return res.status(400).json(err);
  }
}
