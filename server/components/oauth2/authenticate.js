/**
 * Created by Manjesh on 14-05-2016.
 */

import { Request, Response } from 'oauth2-server2';
import oauth from './oauth';

module.exports = function authenticate(optionsArg) {
  const options = optionsArg || {};
  return (req, res, next) => {
    const request = new Request({
      headers: { authorization: req.headers.authorization },
      method: req.method,
      query: req.query,
      body: req.body,
    });
    const response = new Response(res);

    oauth.authenticate(request, response, options)
      .then((token) => {
        // Request is authorized.
        const reqArg = req;
        if (token) {
          reqArg.user = token.user;
        }
        return next();
      })
      .catch((err) => {
        // Request is not authorized.
        res.status(err.code || 500).json(err);
      });
  };
};
