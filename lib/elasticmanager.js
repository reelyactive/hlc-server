/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const { Client } = require('@elastic/elasticsearch');


const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_ELASTICSEARCH_PING_RETRY_MILLISECONDS = 30000;


/**
 * ElasticManager Class
 * Handles interaction with elements of the Elastic stack.
 */
class ElasticManager {

  /**
   * ElasticManager constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.node = options.node || DEFAULT_ELASTICSEARCH_NODE;
    this.client = new Client({ node: self.node });
  }

  /**
   * Ping Elasticsearch until successful, then callback.
   * @param {callback} callback Function to call on completion.
   */
  notifyOnElasticsearchRunning(callback) {
    let client = this.client;

    retryUntilSuccess(this.client.ping,
                      DEFAULT_ELASTICSEARCH_PING_RETRY_MILLISECONDS,
                      function() {
      callback(client);
    });
  }

  /**
   * Query the health of the Elasticsearch cluster, if present.
   * @param {callback} callback Function to call on completion.
   */
  queryElasticsearchHealth(callback) {
    let self = this;

    self.client.ping(function(error) {
      if(error) {
        return callback(error);  // Elasticsearch is not present
      }
      else {
        self.client.cluster.health(function(error, response) {
          if(error) {
            return callback(error);
          }
          return callback(null, response.body);
        });
      }
    });
  }

  /**
   * Execute the given Elasticsearch query.
   * @param {Object} query The search query (as JSON).
   * @param {callback} callback Function to call on completion.
   */
  executeSearchQuery(query, callback) {
    let options = { index: 'raddec', body: query };

    this.client.search(options, function(error, result) {
      if(error) {
        let response = { _meta: { message: error.name,  statusCode: 501 } };
        return callback(501, response);
      }
      return callback(200, result.body);
    });
  }

}


/**
 * Retry the given command until successful, then callback.
 * @param {function} command The function to call.
 * @param {Number} interval The retry interval in milliseconds.
 * @param {ElasticManager} instance The ElasticManager instance.
 */
function retryUntilSuccess(command, interval, callback) {
  command(function(error) {
    if(error) {
      setTimeout(retryUntilSuccess, interval, command, interval, callback);
    }
    else {
      return callback();
    }
  });
}


module.exports = ElasticManager;
