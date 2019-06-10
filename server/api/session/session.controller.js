/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/sessions              ->  index
 * POST    /api/sessions              ->  create
 * GET     /api/sessions/:id          ->  show
 * PUT     /api/sessions/:id          ->  upsert
 * PATCH   /api/sessions/:id          ->  patch
 * DELETE  /api/sessions/:id          ->  destroy
 */


import jsonpatch from 'fast-json-patch';
import { Session } from '../../conn/sqldb';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function (entity) {
    try {
      // eslint-disable-next-line prefer-reflect
      jsonpatch.apply(entity, patches, /* validate */ true);
    } catch (err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Sessions
export function index(req, res) {
  return Session.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Session from the DB
export function show(req, res) {
  return Session.find({
    where: {
      _id: req.params.id,
    },
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Session in the DB
export function create(req, res) {
  return Session.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Session in the DB at the specified ID
export function upsert(req, res) {
  if (req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }

  return Session.upsert(req.body, {
    where: {
      _id: req.params.id,
    },
  })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Session in the DB
export function patch(req, res) {
  if (req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }
  return Session.find({
    where: {
      _id: req.params.id,
    },
  })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Session from the DB
export function destroy(req, res) {
  return Session.find({
    where: {
      _id: req.params.id,
    },
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
