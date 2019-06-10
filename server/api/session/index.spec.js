'use strict';

/* globals sinon, describe, expect, it */

var proxyquire = require('proxyquire').noPreserveCache();

var sessionCtrlStub = {
  index: 'sessionCtrl.index',
  show: 'sessionCtrl.show',
  create: 'sessionCtrl.create',
  upsert: 'sessionCtrl.upsert',
  patch: 'sessionCtrl.patch',
  destroy: 'sessionCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var sessionIndex = proxyquire('./index.js', {
  express: {
    Router() {
      return routerStub;
    }
  },
  './session.controller': sessionCtrlStub
});

describe('Session API Router:', function() {
  it('should return an express router instance', function() {
    expect(sessionIndex).to.equal(routerStub);
  });

  describe('GET /api/sessions', function() {
    it('should route to session.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'sessionCtrl.index')
        ).to.have.been.calledOnce;
    });
  });

  describe('GET /api/sessions/:id', function() {
    it('should route to session.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'sessionCtrl.show')
        ).to.have.been.calledOnce;
    });
  });

  describe('POST /api/sessions', function() {
    it('should route to session.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'sessionCtrl.create')
        ).to.have.been.calledOnce;
    });
  });

  describe('PUT /api/sessions/:id', function() {
    it('should route to session.controller.upsert', function() {
      expect(routerStub.put
        .withArgs('/:id', 'sessionCtrl.upsert')
        ).to.have.been.calledOnce;
    });
  });

  describe('PATCH /api/sessions/:id', function() {
    it('should route to session.controller.patch', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'sessionCtrl.patch')
        ).to.have.been.calledOnce;
    });
  });

  describe('DELETE /api/sessions/:id', function() {
    it('should route to session.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'sessionCtrl.destroy')
        ).to.have.been.calledOnce;
    });
  });
});
