/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */

// TODO: move to a library


const MESSAGE_OK = "ok";
const MESSAGE_CREATED = "created";
const MESSAGE_NOTFOUND = "notFound";
const MESSAGE_BADREQUEST = "badRequest";
const MESSAGE_NOTIMPLEMENTED = "notImplemented";
const MESSAGE_SERVICEUNAVAILABLE = "serviceUnavailable";
const CODE_OK = 200;
const CODE_CREATED = 201;
const CODE_NOTFOUND = 404;
const CODE_BADREQUEST = 400;
const CODE_NOTIMPLEMENTED = 501;
const CODE_SERVICEUNAVAILABLE = 503;


/**
 * Prepare the JSON for an API query response.
 * @param {Object} req The HTTP request.
 * @param {Number} status Integer status code.
 * @param {Object} data The data to include in the response.
 */
function prepareResponse(req, status, data) {
  let rootUrl = req.protocol + '://' + req.get('host');
  let queryPath = req.originalUrl;
  let response = {};

  prepareMeta(response, status);
  prepareLinks(response, rootUrl, queryPath);
  prepareData(response, data);

  return response;
}


/**
 * Prepares and adds the _meta to the given API query response.
 * @param {Object} response JSON representation of the response.
 * @param {Number} status Integer status code.
 */
function prepareMeta(response, status) {
  switch(status) {
    case CODE_OK:
      response._meta = { "message": MESSAGE_OK,
                         "statusCode": CODE_OK };
      break;
    case CODE_CREATED:
      response._meta = { "message": MESSAGE_CREATED,
                         "statusCode": CODE_CREATED };
      break;
    case CODE_NOTFOUND:
      response._meta = { "message": MESSAGE_NOTFOUND,
                         "statusCode": CODE_NOTFOUND };
      break; 
    case CODE_NOTIMPLEMENTED:
      response._meta = { "message": MESSAGE_NOTIMPLEMENTED,
                         "statusCode": CODE_NOTIMPLEMENTED };
      break;
    case CODE_SERVICEUNAVAILABLE:
      response._meta = { "message": MESSAGE_SERVICEUNAVAILABLE,
                         "statusCode": CODE_SERVICEUNAVAILABLE };
      break;
    default:
      response._meta = { "message": MESSAGE_BADREQUEST,
                         "statusCode": CODE_BADREQUEST }; 
  }
}


/**
 * Prepares and adds the _links to the given API query response.
 * @param {Object} response JSON representation of the response.
 * @param {String} rootUrl The root URL of the original query.
 * @param {String} queryPath The query path of the original query.
 */
function prepareLinks(response, rootUrl, queryPath) {
  response._links = {};
  response._links.self = { "href": rootUrl + queryPath };
}


/**
 * Prepares and adds the data to the given API query response.
 * @param {Object} response JSON representation of the response.
 * @param {Object} data The data to add to the response.
 */
function prepareData(response, data) {
  if(!data) {
    return;
  }

  for(let property in data) {
    let item = data[property];

    if(Array.isArray(item)) {
      response[property] = {};
      item.forEach(function(element) {
        if(element.hasOwnProperty('_id')) {
          let id = element._id;
          delete element._id;
          response[property][id] = element;
        }
        else {
          // TODO: handle elegantly the lack of _id
        }
      });
    }
    else {
      response[property] = item;
    }
  }
}


module.exports.prepareResponse = prepareResponse;
