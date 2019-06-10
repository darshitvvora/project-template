/*
* Purpose: Middleware for symmetrically encrypting and decrypting values for creating keys
* Usage:
* const { encrypt } = require('../../components/crypto');
* const key = encrypt(`${client.id}|${expires}`);
* const [decryptedClientId, expires] = decrypt(req.query.key).split('|');
* */

const crypto = require('crypto');
const config = require('../config/environment');

const defConf = {
  algo: 'aes-256-ctr',
  pass: config.CRYPTO_PASS || 'It should be highly secretive',
};

export function encrypt(text, conf = defConf) {
  const { algo, pass } = Object.assign({}, defConf, conf);
  const cipher = crypto.createCipher(algo, pass);
  return cipher.update(text, 'utf-8', 'hex') + cipher.final('hex');
}

export function decrypt(text, conf = defConf) {
  const { algo, pass } = Object.assign({}, defConf, conf);
  const decipher = crypto.createDecipher(algo, pass);
  return decipher.update(text, 'hex', 'utf-8') + decipher.final('utf-8');
}
