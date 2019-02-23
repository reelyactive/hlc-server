/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const ELASTICSEARCH_INTERFACE_ROUTE = '/interfaces/elasticsearch';
const QUERY_TEMPLATE_NAMES = [
    'All raddecs',
    'Specific transmitterId',
    'Prefix transmitterId',
    'Aggregate receiverId',
    'Aggregate rec/dec/pac',
    'Auto-date histogram'
];

// DOM elements
let queryTemplates = document.querySelector('#queryTemplates');
let displayCount = document.querySelector('#displayCount');
let queryBox = document.querySelector('#queryBox');
let queryButton = document.querySelector('#queryButton');
let queryResults = document.querySelector('#queryResults');
let responseHits = document.querySelector('#responseHits');
let responseTime = document.querySelector('#responseTime');
let hitsBox = document.querySelector('#hitsBox');
let aggregationsBox = document.querySelector('#aggregationsBox');

// Create query template options
QUERY_TEMPLATE_NAMES.forEach(function(element, index) {
  let option = document.createElement("option");
  option.value = index;
  option.text = element;
  queryTemplates.add(option, null);
});

// Other variables

// Other initialisation
hide(queryButton);
hide(queryResults);

// Update the query JSON based on the selected template
function updateQuery() {
  let query = {};

  switch(queryTemplates.value) {
    case '0': // All raddecs
      query = {
          "size": 10,
          "query": { "match_all": {} },
          "_source": [ "transmitterId", "transmitterIdType", "receiverId",
                       "receiverIdType", "rssi", "timestamp",
                       "numberOfDecodings", "numberOfReceivers",
                       "numberOfPackets" ]
      };
      queryBox.value = JSON.stringify(query, null, 2);
      break;
    case '1': // Specific transmitterId
      query = {
          "size": 10,
          "query": { "term": { "transmitterId": "" } },
          "_source": [ "receiverId", "receiverIdType", "rssi", "timestamp",
                       "numberOfDecodings", "numberOfReceivers",
                       "numberOfPackets", "packets" ]
      };
      queryBox.value = JSON.stringify(query, null, 2);
      break;
    case '2': // Prefix transmitterId
      query = {
          "size": 10,
          "query": { "prefix": { "transmitterId": "" } },
          "_source": [ "transmitterId", "transmitterIdType", "receiverId",
                       "receiverIdType", "rssi", "timestamp",
                       "numberOfDecodings", "numberOfReceivers",
                       "numberOfPackets" ]
      };
      queryBox.value = JSON.stringify(query, null, 2);
      break;
    case '3': // Aggregate receiverId
      query = {
          "size": 0,
          "aggs" : {
            "receivers" : {
              "terms" : {
                "field" : "receiverId.keyword",
                "order" : { "_count" : "desc" },
                "size": 12
              }
            }
          }
      };
      queryBox.value = JSON.stringify(query, null, 2);
      break;
    case '4': // Aggregate rec/dec/pac
      query = {
          "size": 0,
          "aggs" : {
            "numberOfReceivers" : {
              "histogram" : {
                "field" : "numberOfReceivers",
                "interval" : 1
              }
            },
            "numberOfDecodings" : {
              "histogram" : {
                "field" : "numberOfDecodings",
                "interval" : 1,
                "min_doc_count" : 1
              }
            },
            "numberOfDistinctPackets" : {
              "histogram" : {
                "field" : "numberOfDistinctPackets",
                "interval" : 1
              }
            }
          }
      };
      queryBox.value = JSON.stringify(query, null, 2);
      break;
    case '5': // Auto-date histogram
      query = {
          "size": 0,
          "aggs" : {
            "periods" : {
              "auto_date_histogram" : {
                "field" : "timestamp",
                "buckets" : 12
              }
            }
          }
      };
      queryBox.value = JSON.stringify(query, null, 2);
      break;
  }
  queryBox.rows = countNumberOfLines(queryBox.value);
  parseQuery();
}

// Parse the query as typed in the box and confirm it is valid JSON
function parseQuery() {
  let query = {};

  try { query = JSON.parse(queryBox.value); }
  catch(error) {
    queryError.textContent = 'Query must be valid JSON';
    hide(queryButton);
    hide(queryResults);
    show(queryError);
    return null;
  } 

  hide(queryError);
  show(queryButton);
  return query;
}

// Handle the current Elasticsearch query
function handleQuery() {
  let query = parseQuery();
  let url = window.location.protocol + '//' + window.location.hostname + ':' +
            window.location.port + ELASTICSEARCH_INTERFACE_ROUTE;
  url = 'http://localhost:3001/interfaces/elasticsearch';
  let httpRequest = new XMLHttpRequest();

  httpRequest.onreadystatechange = function() {
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if(httpRequest.status === 200) {
        let response = JSON.parse(httpRequest.responseText);
        updateResults(response);
        updateHits(response);
        updateAggregations(response);
        show(queryResults);
      }
      else {
        queryError.textContent = 'Query returned status ' +
                                 httpRequest.status +
                                 '. Is Elasticsearch connected and running?';
        hide(queryResults);
        hide(queryButton);
        show(queryError);
      }
    }
  };
  httpRequest.open('POST', url);
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send(JSON.stringify(query));
}

// Update the results
function updateResults(response) {
  responseHits.textContent = response.hits.total;
  responseTime.textContent = response.took;
}

// Update the hits
function updateHits(response) {
  if(!response.hits.hasOwnProperty('hits') ||
     (response.hits.hits.length === 0)) {
    hide(hitsCard);
  }
  else {
    show(hitsCard);
    hitsBox.textContent = JSON.stringify(response.hits.hits, null, 2);
  }
}

// Update the aggregations
function updateAggregations(response) {
  if(response.hasOwnProperty('aggregations')) {
    aggregationsBox.textContent = JSON.stringify(response.aggregations,
                                                 null, 2);
    show(aggregationsCard);
  }
  else {
    hide(aggregationsCard);
  }
}

// Count the number of lines in the given JSON string
function countNumberOfLines(jsonString) {
  return (jsonString.match(/\r?\n/g) || []).length + 1;
}

// Hide the given element
function hide(element) {
  element.style.display = 'none';
}

// Show the given element
function show(element) {
  element.style.display = '';
}

// Event listeners
queryTemplates.addEventListener('change', updateQuery);
queryBox.addEventListener('keyup', parseQuery);
queryButton.addEventListener('click', handleQuery);
