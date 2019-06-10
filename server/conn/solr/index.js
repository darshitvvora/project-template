/*
* Purpose: Used for querying Solr
* https://www.npmjs.com/package/solr-client
* Usage:
* const solr = require('../../conn/solr');
*  Solr.createQuery()
          .q(`type_s:child and id:${req.params.Id}`)
          .fl('_root_, name, owner_id')
         .then(({ response: { docs: [j] } }) => j),
* */

const Bluebird = require('bluebird');
const solrClient = require('solr-client');
const config = require('../../config/environment');

const { host, port, core, path } = config.solr;

const S = {
  Solr: solrClient.createClient({
    host,
    port,
    core,
    path,
    get_max_request_entity_size: 8000,
    solrVersion: '5.1',
  }),
};


Bluebird.promisifyAll(Object.getPrototypeOf(S.Solr));

module.exports = S.Solr;
