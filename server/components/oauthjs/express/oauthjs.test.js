const request = require('supertest');
const fs = require('fs');

const app = require('../../../app');
const { root, CRON_TOKEN } = require('../../../config/environment/index');
const logger = require('../../../components/logger');
const { Session } = require('../../../conn/sqldb');

describe('User Login GET /oauth/token', () => {
  it('respond with access tokens', (done) => {
    request(app)
      .post('/oauth/token')
      .send({
        username: 'noble',
        password: 'Pass@123',
      })
      .expect('Content-Type', /json/)
      .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      .expect(200)
      .then((res) => {
        fs.writeFileSync(`${root}/logs/hire-credentials.json`, JSON.stringify(res.body));
        done();
      });
  });
});

describe('Mobile Hire User Login GET /oauth/token', () => {
  it('respond with access tokens', (done) => {
    request(app)
      .post('/oauth/token')
      .send({
        username: 'clientdemo',
        password: 'peda123',
        grant_type: 'password',
      })
      .expect('Content-Type', /json/)
      .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      .set('Authorization', 'Basic aGlyZXF1ZXp4ZHJvaWQ6Yjg4N2Q4OGE2ZTFlN2IyMjBmNjQ3NWNiMjE4ZGU2NjM=')
      .expect(200)
      .then((res) => {
        fs.writeFileSync(`${root}/logs/mobile-hire-credentials.json`, JSON.stringify(res.body));
        done();
      })
      .catch(err => logger.error('ss', err));
  });
});

describe('User force Login ', () => {
  before(() => Session
    .update({
      deleted_on: new Date(),
    }, {
      where: {
        user_id: 13,
        deleted_on: null,
      },
    }));

  it('check the login', (done) => {
    request(app)
      .post('/oauth/token')
      .send({
        username: 'noble',
        password: 'Pass@123',
        singleSession: true,
      })
      .expect('Content-Type', /json/)
      .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      .expect(200)
      .then(() => {
        request(app)
          .post('/oauth/token')
          .send({
            username: 'noble',
            password: 'Pass@123',
            singleSession: true,
          })
          .expect(409)
          .then(() => {
            request(app)
              .post('/oauth/token')
              .send({
                username: 'noble',
                password: CRON_TOKEN,
                singleSession: true,
                force: true,
              })
              .expect(200)
              .then(() => done())
              .catch(logger.error);
          })
          .catch(logger.error);
      })
      .catch(logger.error);
  });
});

describe('User force Login /oauth/logoutExceptCurrentSession', () => {
  it('logoutExceptCurrentSession', (done) => {
    request(app)
      .post('/oauth/logoutExceptCurrentSession')
      .send({
        username: 'noble',
        password: 'Pass@123',
      })
      .expect('Content-Type', /json/)
      .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      .expect(200)
      .then((res) => {
        request(app)
          .post('/oauth/logoutExceptCurrentSession')
          .set('Authorization', `Bearer ${res.body.access_token}`)
          .expect(200)
          .then(() => done());
      });
  });
});
