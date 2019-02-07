hlc-server
==========

Hyperlocal context (HLC) server combining [barnowl](https://github.com/reelyactive/barnowl/) and [barnacles](https://github.com/reelyactive/barnacles/).


Installation and Quick Start
----------------------------

It is possible to install and run __hlc-server__ using either [npm](https://www.npmjs.com/) or [Docker](https://www.docker.com/).

### Using npm

```
npm install hlc-server
```

Add the following to a file called server.js:

```javascript
const HLCServer = require('hlc-server');
let app = new HLCServer();
```

and then run with node:

```
node server
```

### Using Docker

```
docker run -p 3001:3001 -p 50000:50000/udp -p 50001:50001/udp reelyactive/hlc-server
```


Hello Hyperlocal Context
------------------------

Browse to [localhost:3001](http://localhost:3001) to see the landing page.

__hlc-server__ will listen for data as follows:
- reel packets over UDP on port 50000
- encoded [raddecs](https://github.com/reelyactive/raddec) over UDP on port 50001

__hlc-server__ will output data as follows:
- [socket.io](https://socket.io/) stream on port 3001


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
