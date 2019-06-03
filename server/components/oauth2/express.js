/**
 * Express configuration
 */

import { Request, Response } from 'oauth2-server2';
import oauth from './oauth';
import { App } from '../../sqldb';

export default function (app) {
  app.all('/oauth2/token', (req, res) => {
    const request = new Request(req);
    const response = new Response(res);

    oauth.token(request, response).then(token => res.json(token))
      .catch(err => res.status(500).json(err));
  });

  app.get('/authorise2', (req, res) => App.findOne({
    where: {
      client_id: req.query.client_id,
      redirect_uri: req.query.redirect_uri,
    },
    attributes: ['id', 'name'],
  })
    .then((model) => {
      if (!model) return res.status(404).json({ error: 'Invalid Client' });
      return res.json(model);
    })
    .catch(err => res.status(err.code || 500).json(err)));

  app.post('/authorise2', (req, res) => {
    const request = new Request(req);
    const response = new Response(res);

    return oauth.authorize(request, response)
      .then((success) => {
        if (req.body.allow !== 'true') {
          return res.json({
            message: 'oauth2 experimental: authorize failed. Please req.body.allow != true',
          });
        }
        // Todo: Testing not done
        return res.status(400).json(success);
      })
      .catch(err => res.status(500).json(err));
    // Todo: cross check above code. Some confusion
    // ((req) => {
    //  if (req.body.allow !== 'true') return callback(null, false);
    //  return callback(null, true, req.user);
    // })
  });
}
