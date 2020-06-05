/**
 * Copyright reelyActive 2019-2020
 * We believe in an open Internet of Things
 */


const { Client } = require('@elastic/elasticsearch');


const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_ELASTICSEARCH_PING_RETRY_MILLISECONDS = 30000;
const MAX_PENDING_OPERATIONS = 32;


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
    this.pendingOperations = new Map();
    this.isBulkPending = false;
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

  /**
   * Enqueue the given Elasticsearch operation (for bulk execution).
   * @param {String} operation The type of operation (ex: create).
   * @param {String} id The document id.
   * @param {String} index The document index.
   * @param {Object} doc The document itself.
   */
  enqueueOperation(operation, id, index, doc) {
    let self = this;

    while(self.pendingOperations.size >= MAX_PENDING_OPERATIONS) {
      let oldestKey = self.pendingOperations.keys().next().value;
      self.pendingOperations.delete(oldestKey);
    }

    self.pendingOperations.set({ operation: operation, id: id, index: index },
                               doc);

    if(!self.isBulkPending) {
      bulk(self);
    }
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


/**
 * Perform a bulk API call, with recursive iteration if more pending operations.
 * @param {ElasticManager} instance The ElasticManager instance.
 */
function bulk(instance) {
  let body = [];
  instance.isBulkPending = true;

  instance.pendingOperations.forEach(function(doc, key) {
    let isSupportedOperation = true;

    switch(key.operation) {
      case 'create':
        body.push({ "create": { "_index": key.index, "_id": key.id } });
        break;
      default:
        isSupportedOperation = false;
    }

    if(isSupportedOperation) {
      body.push(doc);
    }
  });
  instance.pendingOperations.clear();

  instance.client.bulk({ body: body }, function(error, result) {
    let isMorePendingOperations = (instance.pendingOperations.size > 0);
    if(error) {
      // TODO: communicate error?
    }
    if(isMorePendingOperations) {
      bulk(instance);
    }
    else {
      instance.isBulkPending = false;
    }
  });
}


module.exports = ElasticManager;
