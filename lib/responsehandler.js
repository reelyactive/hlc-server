/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var STATUS_OK = "ok";
var STATUS_NOTFOUND = "notFound";
var STATUS_BADREQUEST = "badRequest";
var CODE_OK = 200;
var CODE_NOTFOUND = 404;
var CODE_BADREQUEST = 400;


/**
 * Prepares the JSON for an API query response which is successful
 * @param {Object} devices List of devices
 * @param {Object} params The parameters of the query
 */
function prepareResponse(devices, params) {
  var response = {};
  prepareMeta(response, STATUS_OK);
  prepareLinks(response, params);
  prepareDevices(response, devices, params);
  return response;
};


/**
 * Prepares the JSON for an API query response which is unsuccessful
 * @param {String} status String representing the status message
 */
function prepareFailureResponse(status) {
  var response = {};
  prepareMeta(response, status);
  return response;
};


/**
 * Prepares and adds the _meta to the given API query response
 * @param {Object} response JSON representation of the response
 * @param {String} status String representing the status message
 */
function prepareMeta(response, status) {
  switch(status) {
    case STATUS_OK:
      response._meta = { "message": STATUS_OK,
                         "statusCode": CODE_OK };
      break;
    case STATUS_NOTFOUND:
      response._meta = { "message": STATUS_NOTFOUND,
                         "statusCode": CODE_NOTFOUND };
      break;   
    default:
      response._meta = { "message": STATUS_BADREQUEST,
                         "statusCode": CODE_BADREQUEST }; 
  }
};


/**
 * Prepares and adds the _links to the given API query response
 * @param {Object} response JSON representation of the response
 * @param {Object} params The query parameters
 */
function prepareLinks(response, params) {
  var selfLink = { "href": params.rootUrl + params.queryPath };
  response._links = {};
  response._links["self"] = selfLink;
}


/**
 * Prepares and adds the devices to the given API query response
 * @param {Object} response JSON representation of the response
 * @param {Object} devices The list of devices
 * @param {Object} params The query parameters
 */
function prepareDevices(response, devices, params) {
  for(device in devices) {
    devices[device].href = params.rootUrl + "/id/" + device;
  }
  response.devices = devices;
}


module.exports.prepareResponse = prepareResponse;
module.exports.prepareFailureResponse = prepareFailureResponse;
