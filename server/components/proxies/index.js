const nock = require('nock');
const Notify = require('../../components/notify');

const Proxies = {
  routesms() {
    nock('http://sms6.rmlconnect.net:8080')
      .persist()
      .get('/bulksms/bulksms')
      .query((actualQueryObject) => {
        Notify.slack(`RouteSMS: ${JSON.stringify(actualQueryObject)}`);
        return true;
      })
      .reply(200, { message: 'reply by proxy by quezx.' });
  },
  gupshup() {
    nock('https://enterprise.smsgupshup.com')
      .persist()
      .get('/GatewayAPI/rest')
      .query((actualQueryObject) => {
        Notify.slack(`GupShupSMS: ${JSON.stringify(actualQueryObject)}`);
        return true;
      })
      .reply(200, { message: 'reply by proxy by QuezX.' });
  },
};

exports.enable = function enable(list) {
  list.map(proxy => (Proxies[proxy]()));
};
