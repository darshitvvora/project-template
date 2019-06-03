/*
* Purpose: Use this to encode/decode any value
* Usage:
* const hashids = require('./hashids')
* const encodedValue = await hashids.encode(value);
* const decodedValue = await hashids.decode(value);
* */

const Hashids = require('hashids');

const { HASHID_SECRET } = require('../../config/environment');
const logger = require('../../components/logger');

const hashids = new Hashids(HASHID_SECRET, 4, 'qwertyuiopasdfghjklzxcvbnm123456789');

const encode = async (id) => {
  try {
    return hashids.encode(id);
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

const decode = async (id) => {
  try {
    return hashids.decode(id.trim());
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

module.exports = {
  encode,
  decode,
};
