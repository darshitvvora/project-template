import config from '../config/environment';

function cronAuth() {
  return (req, res, next) => {
    if (req.query.token && req.query.token === config.CRON_TOKEN) {
      return next();
    }
    return res.status(401).end();
  };
}

export default cronAuth;
