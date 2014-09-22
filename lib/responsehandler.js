var STATUS_OK = "ok";
var STATUS_NOTFOUND = "notFound";
var STATUS_BADREQUEST = "badRequest";
var CODE_OK = 200;
var CODE_NOTFOUND = 404;
var CODE_BADREQUEST = 400;


/**
 * Prepares the JSON for an API query response which is successful
 * @param {devices} Object of devices
 */
function prepareResponse(devices) {
  var response = {};
  prepareMeta(response, STATUS_OK);
  response.devices = devices;
  return response;
};


/**
 * Prepares the JSON for an API query response which is unsuccessful
 * @param {status} String representing the status message
 */
function prepareFailureResponse(status) {
  var response = {};
  prepareMeta(response, status);
  return response;
};


/**
 * Prepares and adds the _meta to the given API query response
 * @param {response} Object as JSON representation of the response
 * @param {status} String representing the status message
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


module.exports.prepareResponse = prepareResponse;
module.exports.prepareFailureResponse = prepareFailureResponse;
