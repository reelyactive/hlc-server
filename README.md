hlc-server
==========

Hyperlocal context (HLC) server combining all the core open source software packages of the reelyActive stack for convenience and ease of exploration of features and applications.  _Observe who/what is where/how, in real time, in any physical space._ Just add radio infrastructure (ex: RFID readers, Raspberry Pi, ...) for source data.


Getting Started Tutorials
-------------------------

The easiest way to get started with __hlc-server__:
- [Install our open source software suite on a Laptop](https://reelyactive.github.io/diy/laptop-suite/)
- [Install our open source software suite on a Pi](https://reelyactive.github.io/diy/pi-suite/)


Installation and Quick Start
----------------------------

It is possible to install and run __hlc-server__ using either [npm](https://www.npmjs.com/) or [Docker](https://www.docker.com/).

### Using git and npm

```
git clone https://github.com/reelyactive/hlc-server.git
cd hlc-server
npm install
```

Add then to run:

```
npm start
```

### Using Docker

```
docker run -p 3001:3001 -p 50000:50000/udp -p 50001:50001/udp reelyactive/hlc-server
```


Hello Hyperlocal Context
------------------------

Browse to [localhost:3001](http://localhost:3001) to see the landing page.

__hlc-server__ will listen for data as follows:
- reel packets over UDP on port 50000 (via [barnowl-reel](https://github.com/reelyactive/barnowl-reel) UdpListener)
- encoded [raddecs](https://github.com/reelyactive/raddec) over UDP on port 50001

__hlc-server__ will output data as follows:
- [socket.io](https://socket.io/) stream on port 3001 (via [barnacles-socketio](https://github.com/reelyactive/barnacles-socketio))
- decoded [raddecs](https://github.com/reelyactive/raddec) to Elasticsearch, if an instance is running (by default on port 9200)

![Default I/O](https://reelyactive.github.io/hlc-server/images/default-io.png)


Web Apps
--------

A variety of web apps designed to make it easy to familiarise oneself with the many platform features and capabilities can be accessed via the landing page at [localhost:3001](http://localhost:3001).  These web apps are built with the open source _beacorcut_ stack of [beaver.js](https://github.com/reelyactive/beaver), [cormorant.js](https://github.com/reelyactive/cormorant) and [cuttlefish.js](https://github.com/reelyactive/cuttlefish).


Architecture Overview
---------------------

Note that the integration of some open source software packages with hlc-server is still a work in progress.

![Architecture Overview](https://reelyactive.github.io/hlc-server/images/architecture-overview.png)


Environment Variables
---------------------

__hlc-server__ observes the following environment variables:

| Environment Variable | Default               | Description                 | 
|:---------------------|:----------------------|:----------------------------|
| PORT                 | 3001                  | The hlc-server port         |
| REEL_PORT            | 50000                 | The port on which to listen for reel packets over UDP |
| RADDEC_PORT          | 50001                 | The port on which to listen for raddecs over UDP |
| ELASTICSEARCH_NODE   | http://localhost:9200 | The Elasticsearch node      |


Add listeners and interfaces
----------------------------

__hlc-server__ wraps the [barnowl](https://github.com/reelyactive/barnowl/) addListener() function and the [barnacles](https://github.com/reelyactive/barnacles/) addInterface() function to facilitate adding listeners and interfaces.

### addListener()

Add any [barnowl-x listener](https://github.com/reelyactive/barnowl#where-to-listen) to connect with a hardware interface in just two lines of code.  For example, to listen for reel data over a serial connection:

```javascript
const HLCServer = require('hlc-server');
const BarnowlReel = require('barnowl-reel'); // 1: Include the interface package

let app = new HLCServer();

// 2: Add the specific listener with relevant options
app.addListener(BarnowlReel, {}, BarnowlReel.SerialListener, { path: "auto" });
```

### addInterface()

Add any [barnacles-x interface](https://github.com/reelyactive/barnacles#how-to-distribute-data) to distribute the data stream in just two lines of code.  For example, to forward data via a webhook:

```javascript
const HLCServer = require('hlc-server');
const BarnaclesWebhook = require('barnacles-webhook'); // 1: Include the package

let app = new HLCServer();

// 2: Add the interface with relevant options
app.addInterface(BarnaclesWebhook, { hostname: "127.0.0.1", port: 3000 });
```


What's next?
------------

__hlc-server__ v1.0.0 was released in February 2019, superseding all earlier versions, the latest of which remains available in the [release-0.5 branch](https://github.com/reelyactive/hlc-server/tree/release-0.5) and as [hlc-server@0.5.21 on npm](https://www.npmjs.com/package/hlc-server/v/0.5.21).

The v1.0 release of __hlc-server__ is a work in progress as the v1.0 releases of [barnowl](https://github.com/reelyactive/barnowl/), [barnacles](https://github.com/reelyactive/barnacles/), [chickadee](https://github.com/reelyactive/chickadee/), [barterer](https://github.com/reelyactive/barterer/), [beaver](https://github.com/reelyactive/beaver/), [cormorant](https://github.com/reelyactive/cormorant/) and [cuttlefish](https://github.com/reelyactive/cuttlefish/) evolve and/or become available.  The objective is to combine all these ingredients required for [hyperlocal context](https://www.reelyactive.com/context/) in a user-friendly deploy-anywhere package/container that promotes discovery and experimentation.


License
-------

MIT License

Copyright (c) 2014-2019 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
