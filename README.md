hlc-server
==========


HLC: Hyperlocal Context
-----------------------

How can computers understand the context of what's happening in a space? First and foremost, they need a digital representation of everything and everyone that is present.  Hyperlocal context is a digital snapshot of a physical space and its contents. It combines the concepts of identification, location and time.  _Read more at:_ [context.reelyactive.com](http://context.reelyactive.com/context.html)

hlc-server provides a layer on top of our other npmjs package, [barnowl](https://www.npmjs.org/package/barnowl).  Please _first_ consult the [documentation for barnowl](https://www.npmjs.org/package/barnowl) which is far more mature at this point!


Installation
------------

    npm install hlc-server


Hello Hyperlocal Context
------------------------

```javascript
var server = require('hlc-server');
var app = new server({ httpPort: 3001 }); // Default port is 3001

app.bind('udp', '192.168.1.101:50000');   // See barnowl: "Where to listen?"
```

Then browse to [http://localhost:3001](http://localhost:3001) to see the landing page.

![HLC landing page](http://reelyactive.com/images/hlc-landing.png)


Querying Hyperlocal Context
---------------------------

To query the real-time context where a BLE device is emitting the AdvA-48 identifier 1a:2b:3c:4d:5e:6f make the following request:

- [http://localhost:3001/id/1a2b3c4d5e6f](http://localhost:3001/id/1a2b3c4d5e6f)

To query the real-time context of a place named _notman_ make the following request:

- [http://localhost:3001/at/notman](http://localhost:3001/at/notman)

A _test_ place is permanently enabled and is associated with IDs 001bc50940800000 and 001bc50940810000:

- [http://localhost:3001/at/test](http://localhost:3001/at/test)


Administrative Interface
------------------------

Browse to [http://localhost:3001/admin](http://localhost:3001/admin) to associate IDs with URLs containing JSON metadata, and to add places and their associated IDs.  The default username and password are both _admin_.


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!


License
-------

MIT License

Copyright (c) 2014 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

