hlc-server
==========


HLC: Hyperlocal Context
-----------------------

How can computers understand the context of what's happening in a space? First and foremost, they need a digital representation of everything and everyone that is present.  Hyperlocal context is a digital snapshot of a physical space and its contents. It combines the concepts of identification, location and time.  _Read more at:_ [context.reelyactive.com](http://context.reelyactive.com/context.html)

hlc-server acts as a convenience wrapper around our other npmjs packages, [barnowl](https://www.npmjs.org/package/barnowl), [barnacles](https://www.npmjs.org/package/barnacles), [barterer](https://www.npmjs.org/package/barterer) and [chickadee](https://www.npmjs.org/package/chickadee).  You may consult the documentation for each individual package for a better understanding of the ensemble.

hlc-server is the middle piece in the [json-silo](https://www.npmjs.org/package/json-silo) - hlc-server - [smartspaces](https://www.npmjs.org/package/smartspaces) stack.  The easiest way to learn how these all fit together is our [Make a Smart Space tutorial](http://reelyactive.github.io/make-a-smartspace.html).


Installation
------------

    npm install hlc-server


Hello Hyperlocal Context
------------------------

```javascript
var server = require('hlc-server');
var app = new server();

// See barnowl: "Where to listen?"
app.bind( { protocol: 'test', path: 'default' } );
```

Then browse to [http://localhost:3001](http://localhost:3001) to see the landing page.

![HLC landing page](http://reelyactive.com/images/hlc-landing.png)

Type _test_ in the search bar (or browse to [http://localhost:3001/at/test](http://localhost:3001/at/test)) to see the following test output:

    {
      "_meta": {
        "message": "ok",
        "statusCode": 200
      },
      "_links": {
        "self": { "href": "http://localhost:3001/at/test" }
      },
      "devices": {
        "001bc50940100000": {
          "identifier": {
            "type": "EUI-64",
            "value": "001bc50940100000"
          },
          "timestamp": "2015-01-01T12:34:56.789Z",
          "radioDecodings": [
            {
              "rssi": 129,
              "identifier": {
                "type": "EUI-64",
                "value": "001bc50940800000"
              },
              "url": "http://reelyactive.com/metadata/ra-rxxx.json",
              "href": "http://localhost:3001/id/001bc50940800000"
            }
          ],
          "url": "http://reelyactive.com/metadata/test.json",
          "href": "http://localhost:3001/id/001bc50940100000"
        }
      }
    }


RESTful interactions
--------------------

Include _Content-Type: application/json_ in the header of all interactions in which JSON is sent to hlc-server.

__GET /id?value=identifier__

Retrieve the device association based on the given identifier value via [chickadee](https://www.npmjs.org/package/chickadee).  This can be useful for retrieving the static identifier of a device based on its current cyclic identifier.  For example to retrieve the association related to a Bluetooth Smart device advertising "2c0ffeeb4bed" as a random address you would GET /id?value=2c0ffeeb4bed.

__POST /id__

Create a new device association via [chickadee](https://www.npmjs.org/package/chickadee).  For example, to associate a device with identifier 001bc50940100000 to the url [http://myjson.info/story/test](http://myjson.info/story/test) include the following JSON:

    {
      "identifier": "001bc50940100000",
      "url": "http://myjson.info/story/test"
    }

__GET /id/id__

Retrieve real-time location/context for a given device via [barterer](https://www.npmjs.org/package/barterer).  If _Accept: text/html_ is given priority in the request header, a human-friendly HTML rendering of the query result is returned.  Otherwise, for example, the identifier 001bc50940100000 would return:

    {
      "_meta": {
        "message": "ok",
        "statusCode": 200
      },
      "_links": {
        "self": {
          "href": "http://localhost:3001/id/001bc50940100000"
        }
      },
      "devices": {
        "001bc50940100000": {
          "identifier": {
            "type": "EUI-64",
            "value": "001bc50940100000",
            "flags": {
              "transmissionCount": 0
            }
          },
          "timestamp": "2015-01-01T12:34:56.789Z",
          "radioDecodings": [
            {
              "rssi": 136,
              "identifier": {
                "type": "EUI-64",
                "value": "001bc50940800000"
              },
              "url": "http://reelyactive.com/metadata/ra-rxxx.json",
              "href": "http://localhost:3001/id/001bc50940800000"
            }
          ],
          "url": "http://reelyactive.com/metadata/test.json",
          "href": "http://localhost:3001/id/001bc50940100000"
        }
      }
    }

__PUT /id/id__

Update a device association via [chickadee](https://www.npmjs.org/package/chickadee).  For example, to associate a device with identifier 001bc50940100000 to the url [http://myjson.info/story/lonely](http://myjson.info/story/lonely) include the following JSON:

    {
      "identifier": "001bc50940100000",
      "url": "http://myjson.info/story/lonely"
    }

__POST /at__

Create a new place association via [chickadee](https://www.npmjs.org/package/chickadee).  For example, to associate a place named _test_ to the device identifiers 001bc50940800000 and 001bc50940810000 include the following JSON:

    {
      "place": "test",
      "identifiers": [ "001bc50940800000", "001bc50940810000" ]
    }

__GET /at/place__

Retrieve real-time location/context for a given place via [barterer](https://www.npmjs.org/package/barterer).  If _Accept: text/html_ is given priority in the request header, a human-friendly HTML rendering of the query result is returned.  Otherwise, for example, the place named _test_ would return:

    {
      "_meta": {
        "message": "ok",
        "statusCode": 200
      },
      "_links": {
        "self": {
          "href": "http://localhost:3001/at/test"
         }
      },
      "devices": {
        "001bc50940100000": {
          "identifier": {
            "type": "EUI-64",
            "value": "001bc50940100000",
            "flags": {
              "transmissionCount": 0
            }
          },
          "timestamp": "2015-01-01T12:34:56.789Z",
          "radioDecodings": [
            {
              "rssi": 141,
              "identifier": {
                "type": "EUI-64",
                "value": "001bc50940800000"
              },
              "url": "http://reelyactive.com/metadata/ra-rxxx.json",
              "href": "http://localhost:3001/id/001bc50940800000"
            }
          ],
          "url": "http://reelyactive.com/metadata/test.json",
          "href": "http://localhost:3001/id/001bc50940100000"
        },
        "fee150bada55": {
          "identifier": {
            "type": "ADVA-48",
            "value": "fee150bada55",
            "advHeader": {
              "type": "ADV_NONCONNECT_IND",
              "length": 22,
              "txAdd": "random",
              "rxAdd": "public"
            },
            "advData": {
              "flags": [
                "LE Limited Discoverable Mode",
                "BR/EDR Not Supported"
              ],
              "completeLocalName": "reelyActive"
            }
          },
          "timestamp": "2015-01-01T12:34:56.789Z",
          "radioDecodings": [
            {
              "rssi": 111,
              "identifier": {
                "type": "EUI-64",
                "value": "001bc50940810000"
              },
              "url": "http://reelyactive.com/metadata/ra-rxxx.json",
              "href": "http://localhost:3001/id/001bc50940810000"
            }
          ],
          "url": "http://reelyactive.com/metadata/bluetoothsmart.json",
          "href": "http://localhost:3001/id/fee150bada55"
        }
      }
    }


Administrative Interface
------------------------

Browse to [http://localhost:3001/admin](http://localhost:3001/admin) to associate IDs with URLs containing JSON metadata, and to add places and their associated IDs.  The default password is _admin_.


Connecting with services
------------------------

You can connect the [barnacles](https://www.npmjs.org/package/barnacles) inside hlc-server with any of the services they support.  For detailed information about each service consult the [barnacles documentation](https://www.npmjs.org/package/barnacles).  A service is added as follows:

```javascript
app.addNotificationService(options);
```


Options
-------

You can create an instance of hlc-server with any or all of the following options (what's shown are the defaults):

    {
      httpPort: 3001,
      password: 'admin',
      secret: "YoureProbablyGonnaWantToChangeIt",
      useCors: false,
      maxDecoders: 3,
      maxStaleMilliseconds: 10000
    }

Note that if you see _Access-Control-Allow-Origin_ errors, you'll likely want to set useCors to true.


Implicit Associations
---------------------

Consult the documentation for [chickadee](https://www.npmjs.org/package/chickadee) to learn more about which devices are implicitly associated (via their identifier) with static metadata or a third-party API (via a URL).


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!


License
-------

MIT License

Copyright (c) 2014-2015 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

