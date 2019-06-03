
import OAuthServer from 'oauth2-server2';
import oAuthModel from './model';

const oauth = new OAuthServer({
  model: oAuthModel,
});

module.exports = oauth;
