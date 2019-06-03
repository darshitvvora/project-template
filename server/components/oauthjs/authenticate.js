import oauth from './module';
import oauthV2 from './index.v2';
import { APP } from '../../sqldb';

module.exports = () => (reqArgs, res, next) => {
  const req = reqArgs;
  // OAuth Authentication Middleware
  const auth = req.get('version') === '2.0' ? oauthV2 : oauth;
  if (req.user) return next();
  return auth.authorise()(req, res, (data) => {
    if (req.user) {
      req.user.admin = (req.query.force === 'true') || !!(
        ((req.get('admin') === 'true') || (req.query.admin === 'true'))
      && req.user.admin_flag);
      req.user.app_id = req.oauth.bearerToken.app_id;
      req.user.product_id = APP[req.user.app_id];
    }
    return next(data);
  });
};
