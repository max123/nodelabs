
This lab uses the `pingpong` module (`npm install pingpong`). There are 2 node.js applications, `ppclient.js` and `ppserver.js`.

Run them as follows:

	$ node ppserver.js &
	88070
	$
	
	$ while true; do node ppclient.js; done > /dev/null

•` mdb(1)` is the modular debugger that comes with SmartOS, illumos, and Solaris
• Node-specific commands have been added
• See http://www.illumos.org/man/1/mdb and http://illumos.org/books/mdb/ preface.html for details


Let them run for a few minutes, then:

	$ gcore 88070
	gcore: core.88070 dumped
	$ mdb core.88070
	Loading modules: [ libumem.so.1 libc.so.1 ld.so.1 ]
	> ::load v8.so
	V8 version: 3.14.5.9
	Autoconfigured V8 support from target
	C++ symbol demangling enabled
	> ::dcmds !grep js
	findjsobjects            - find JavaScript objects
	jsconstructor            - print the constructor for a JavaScript object
	jsframe                  - summarize a JavaScript stack frame
	jsfunctions              - list JavaScript functions
	jsprint                  - print a JavaScript object
	jssource                 - print the source code for a JavaScript function
	jsstack                  - print a JavaScript stacktrace
	>

• help exists for the dcmds

	> ::help findjsobjects
	
	NAME
	findjsobjects - find JavaScript objects

	SYNOPSIS
	[ addr ] ::findjsobjects [-vb] [-r | -c cons | -p prop]

	DESCRIPTION

	Finds all JavaScript objects in the V8 heap via brute force iteration over
	all mapped anonymous memory.  (This can take up to several minutes on large
	dumps.)  The output consists of representative objects, the number of
	instances of that object and the number of properties on the object --
	followed by the constructor and first few properties of the objects.  Once
	run, subsequent calls to ::findjsobjects use cached data.  If provided an
	address (and in the absence of -r, described below), ::findjsobjects treats
	the address as that of a representative object, and lists all instances of
	that object (that is, all objects that have a matching property signature).

	OPTIONS

    -b       Include the heap denoted by the brk(2) (normally excluded)
    -c cons  Display representative objects with the specified constructor
    -p prop  Display representative objects that have the specified property
    -l       List all objects that match the representative object
    -m       Mark specified object for later reference determination via -r
    -r       Find references to the specified and/or marked object(s)
    -v       Provide verbose statistics


	ATTRIBUTES

	Target: proc
	Module: v8.so
	Interface Stability: Unstable

There are also mdb commands for v8.

	> ::dcmds !grep v8
	v8array                  - print elements of a V8 FixedArray
	v8classes                - list known V8 heap object C++ classes
	v8code                   - print information about a V8 Code object
	v8field                  - manually add a field to a given class
	v8frametypes             - list known V8 frame types
	v8function               - print JSFunction object details
	v8internal               - print v8 object internal fields
	v8load                   - load canned config for a specific V8 version
	v8print                  - print a V8 heap object
	v8str                    - print the contents of a V8 string
	v8type                   - print the type of a V8 heap object
	v8types                  - list known V8 heap object types
	v8warnings               - toggle V8 warnings
	>

Let's look at the javascript objects.

	> ::findjsobjects
	OBJECT #OBJECTS   #PROPS CONSTRUCTOR: PROPS
	8f23e835        1        0 Cluster
	99dcc119        1        0
	b3c2359d        1        0 <anonymous> (as <anon>)
	8f209b31        1        0 JSON
	8f21a321        1        0 <anonymous> (as d)
	8f247359        1        0 WriteStream
	8f238bd9        1        0 Server
	8f2154a9        1        0 MathConstructor
	8f22d239        1        0 Module
	b3c15d2d        1        0 Error
	b3c1aedd        1        0 TCP
	b3c50671        2        0 Signal
	80475cd    12412        0 Object
	8a29b2c5    19006        0 Array
	b3c6dd31        1        1 Object:
	b3c1106d        1        1 Object: bind
	be60d489        1        1 Object: end
	b3c2906d        1        1 Object: value
	b3c23351        1        1 Object: connection
	b3c1e611        1        1 Object: /root/node_modules/pingpong
	...
	a5341d01     4011       17 WritableState: highWaterMark, objectMode, ...
	a25340bd     4010       21 ReadableState: highWaterMark, buffer, length, ...
	9a1cbfa1     4008       23 Socket: _connecting, _handle, _readableState, ...
	>

Now let's take a look at the last object.  There are 4008 of these objects, and 9a1cbfa1 is the address of a "representative object".  We
can get all of the objects with the same properties, and see what, if anything, refers to those objects.

	> 9a1cbfa1::findjsobjects | ::findjsobjects -r
	9a1cbfa1 is not referred to by a known object.
	be60d7e9 is not referred to by a known object.
	b3c857cd referred to by b3c85afd.socket
	b3c7b3d9 referred to by b3c7b709.socket
	b3c7b3d9 referred to by b3c7b3c9.owner
	b3c7b3d9 referred to by b3c7bb99[0]
	b3c7b3d9 referred to by b3c7bb99[4]
	b3c7ad05 referred to by b3c7b035.socket
	...
	>
	
And some more information, using the first object that has a reference.
	
	> b3c857cd::jsprint
	{
    "_connecting": false,
    "_handle": null,
    "_readableState": {
    "highWaterMark": 16384,
    "buffer": [...],
    "length": 0,
    "pipes": null,
    "pipesCount": 0,
    "flowing": false,
    "ended": true,
    "endEmitted": true,
    "reading": false,
    "calledRead": true,
    "sync": false,
    "needReadable": true,
    "emittedReadable": false,
    "readableListening": false,
    "objectMode": false,
    "defaultEncoding": "utf8",
    "ranOut": false,
    "awaitDrain": 0,
    "readingMore": false,
    "decoder": null,
    "encoding": null,
    },
    "readable": false,
    "domain": null,
    "_events": {
    "_socketEnd": function onSocketEnd,
    "readable": function <anonymous> (as <anon>),
    "data": function <anonymous> (as <anon>),
    "close": [...],
    "error": function <anonymous> (as <anon>),
    "finish": function onSocketFinish,
    },
    "_maxListeners": 10,
    "_writableState": {
    "highWaterMark": 16384,
    "objectMode": false,
    "needDrain": false,
    "ending": true,
    "ended": true,
    "finished": true,
    "decodeStrings": false,
    "defaultEncoding": "utf8",
    "length": 0,
    "writing": false,
    "sync": false,
    "bufferProcessing": false,
    "onwrite": function <anonymous> (as WritableState.onwrite),
    "writecb": null,
    "writelen": 0,
    "buffer": [...],
    "errorEmitted": false,
    },
    "writable": false,
    "allowHalfOpen": false,
    "onend": null,
    "destroyed": true,
    "bytesRead": 23,
    "_bytesDispatched": 21,
    "_pendingData": null,
    "_pendingEncoding": "",
    "server": {
    "domain": null,
    "_events": [...],
    "_maxListeners": 10,
    "_connections": 0,
    "_handle": [...],
    "_usingSlaves": false,
    "_slaves": [...],
    "allowHalfOpen": false,
    "_connectionKey": "4:0.0.0.0:8000",
    },
    "pause": function <anonymous> (as stream.pause),
    "resume": function <anonymous> (as stream.resume),
    "_consuming": true,
    "_idleNext": null,
    "_idlePrev": null,
    "_idleTimeout": 2147483647,
	}
	
And the referring object:
	
	> b3c85afd::jsprint
	{
    "socket": {
    "_connecting": false,
    "_handle": null,
    "_readableState": [...],
    "readable": false,
    "domain": null,
    "_events": [...],
    "_maxListeners": 10,
    "_writableState": [...],
    "writable": false,
    "allowHalfOpen": false,
    "onend": null,
    "destroyed": true,
    "bytesRead": 23,
    "_bytesDispatched": 21,
    "_pendingData": null,
    "_pendingEncoding": "",
    "server": [...],
    "pause": function <anonymous> (as stream.pause),
    "resume": function <anonymous> (as stream.resume),
    "_consuming": true,
    "_idleNext": null,
    "_idlePrev": null,
    "_idleTimeout": 2147483647,
    },
    "invoke": function invoke,
    "onMessage": function <anonymous> (as client.onMessage),
	}

And the constructors for these two objects.

	> b3c85afd::jsconstructor
	Object
	> b3c857cd::jsconstructor
	Socket

A stack trace of node at the time the core file was obtained.

	> ::jsstack -v
	native: libc.so.1`_portfs+7
	native: uv__io_poll+0xe4
	native: uv_run+0xea
	native: node::Start+0x197
	native: main+0x1b
	native: _start+0x83

(Not that interesting.  In the event loop, waiting for an event.)

Is there a memory leak?

