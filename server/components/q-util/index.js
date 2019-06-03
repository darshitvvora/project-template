const qs = require('query-string');
const _ = require('lodash');
const url = require('url');
const moment = require('moment');

const QUtil = {
  oneFiftyThree: {
    encode: id => new Buffer((id + 153).toString()).toString('base64'),
    decode: (hash) => {
      const base64 = new Buffer(hash, 'base64').toString('ascii');
      return +(((+base64) - 153).toString().split('').join(''));
    },
  },

  restUrlParse({ req: { originalUrl }, base = '' }) {
    const path = url.parse(originalUrl).pathname;
    if (!_.startsWith(path, base)) return {};
    const record = {};
    const parts = path.replace(base, '').split('/');
    const len = parts.length;
    record.resource = parts[0];
    parts.forEach((x, i) => {
      if (len !== 1 && i === len - 1 && isNaN(x)) {
        record.action = x;
        return x;
      }
      if (i % 2) record[`${parts[i - 1]}_id`] = x;
      return x;
    });
    if (Object.keys(record).length === 2) record.type = 'show';
    return record;
  },
  cakeList(list = [], key, value) {
    const hash = {};
    list.forEach((item) => {
      hash[item[key]] = item[value];
    });
    return hash;
  },
  utmBuilder(
    utmContent = 'default',
    utmTerm = 'default',
    utmMedium = 'default',
    utmSource = 'default',
    utmCampaign = 'default',
  ) {
    // http://www.bytefive.com/blogs/understanding-utm_source-utm_medium-and-utm_campaign
    // https://ga-dev-tools.appspot.com/campaign-url-builder/
    return qs.stringify({
      utm_campaign: utmCampaign, // top level segment
      utm_source: utmSource, // search_engine, newsletter sms, email
      utm_medium: utmMedium, // cpc, email
      utm_term: utmTerm, // keywords, product variant like qdrive, qdirect, normal
      utm_content: utmContent, // logolink, actionlink
    });
  },

  getRangeFolder(id) {
    return (id - (id % 10000)).toString();
  },

  wildSearch(argCllection, argKeywords) {
    let collection = argCllection;
    let keywords = argKeywords;
    if (keywords) {
      keywords = keywords.toUpperCase().split(' ');
      _.each(keywords, (keyWord) => {
        collection = _.filter(collection, item => Object
          .keys(item)
          .some(key => (
            Object.prototype.hasOwnProperty.call(item, key) &&
            !key.includes('$$hashKey') &&
            typeof item[key] === 'string' &&
            item[key].toUpperCase().includes(keyWord)
          )));
      });
    }
    return collection;
  },

  floorToPrecision(value, precision) {
    return Math.floor(value * (10 ** precision)) / (10 ** precision);
  },

  getFinancialYear(date = null) {
    const m = +moment(date).format('M');
    const yy = +moment(date).format('YY');
    const financialYear = (m <= 3) ? `${yy - 1}-${yy}` : `${yy}-${yy + 1}`;

    return financialYear;
  },
};

module.exports = QUtil;
