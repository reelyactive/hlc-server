hlc-server
==========


HLC: Hyperlocal Context for the IoT
-----------------------------------

How can computers understand the context of what's happening in a space? First and foremost, they need a digital representation of everything and everyone that is present.  Hyperlocal context is a digital snapshot of a physical space and its contents. It combines the concepts of identification, location and time.  Learn more at: [www.reelyactive.com/context/](http://www.reelyactive.com/context/)

__In the scheme of Things (pun intended)__

hlc-server acts as a convenience wrapper around our other npmjs packages, [barnowl](https://www.npmjs.org/package/barnowl), [barnacles](https://www.npmjs.org/package/barnacles), [barterer](https://www.npmjs.org/package/barterer) and [chickadee](https://www.npmjs.org/package/chickadee).  You may consult the documentation for each individual package for a better understanding of the ensemble.

![hlc-server elements](https://reelyactive.github.io/images/hlcServerElements.jpg)


Installation
------------

    npm install hlc-server

Alternatively, use the Docker repository: [reelyactive/hlc-server](https://hub.docker.com/r/reelyactive/hlc-server/)


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

Type _test_ in the search bar (or browse to [http://localhost:3001/contextnear/tags/test](http://localhost:3001/contextnear/tags/test)) to see a _contextual_ visualisation of what is near the test device(s).  Alternatively, browse to [http://localhost:3001/whatnear/transmitter/fee150bada55](http://localhost:3001/whatnear/transmitter/fee150bada55) for a _non-contextual_ visualisation of the same query.


Additional Visualisations
-------------------------

### bubblescape

Browse to [http://localhost:3001/bubblescape/](http://localhost:3001/bubblescape/) (see [bubblescape](https://github.com/reelyactive/bubblescape)).

### sensorscape

Browse to [http://localhost:3001/sensorscape/](http://localhost:3001/sensorscape/) (see [sensorscape](https://github.com/reelyactive/sensorscape)).


RESTful interactions
--------------------

Include _Content-Type: application/json_ in the header of all interactions in which JSON is sent to hlc-server.

__GET /whereis/transmitter/{device-id}__

__GET /whatnear/transmitter/{device-id}__

__GET /whatat/receiver/{device-id}__

See [barterer](https://www.npmjs.org/package/barterer).

__GET /contextnear/transmitter/{device-id}__

__GET /contextnear/tags/{device-id}__

__GET /contextat/receiver/{device-id}__

__GET /contextat/directory/{device-id}__

__GET /contextat/tags/{device-id}__

See [chickadee](https://www.npmjs.org/package/chickadee).

__GET/PUT/DELETE /associations/{device-id}/__

__GET/PUT/DELETE /associations/{device-id}/url__

__GET/PUT/DELETE /associations/{device-id}/directory__

__GET/PUT/DELETE /associations/{device-id}/tags__

See [chickadee](https://www.npmjs.org/package/chickadee).

__POST /events__

See [barnacles](https://www.npmjs.org/package/barnacles).

__GET /statistics__

See [barnacles](https://www.npmjs.org/package/barnacles).


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
      protectedRequests: [
        { path: "/associations/", methods: [ "PUT", "DELETE" ] }
      ],
      barnowl: { n: 3, enableMixing: true }, // see barnowl
      barnacles: {},                         // see barnacles
      barterer: {},                          // see barterer
      chickadee: {}                          // see chickadee
    }

Note that if you see _Access-Control-Allow-Origin_ errors, you'll likely want to set useCors to true.  To remove authentication from all routes, set protectedRequests to [].


Implicit Associations
---------------------

The [chickadee](https://www.npmjs.org/package/chickadee) package uses [sniffypedia.org](https://sniffypedia.org/) to implicitly associate devices with metadata via their identifier(s).


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!  If you're developing with hlc-server check out:
* [diyActive](https://reelyactive.github.io/) our developer page
* our [node-style-guide](https://github.com/reelyactive/node-style-guide) and [angular-style-guide](https://github.com/reelyactive/angular-style-guide) for development
* our [contact information](http://www.reelyactive.com/contact/) to get in touch if you'd like to contribute


License
-------

MIT License

Copyright (c) 2014-2017 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

