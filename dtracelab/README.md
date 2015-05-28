This lab shows an example use of DTrace to solve a problem.  It is a somewhat contrived example, but does demonstrate several uses of DTrace.

To run the lab:

	$ node file.js
	tmp/words.save
	md5sum = 8e0c0289eb2a5ea9aa66d3cfe78dadaf
	$ ls -l words tmp/words.save <--** these should be identical, but are not**
	-rw-r--r-- 1 student other 2207878 Jun 15 11:32 tmp/ words.save
	-rw-r--r-- 1 student root 2273414 Jun 15 11:19 words
	$ md5sum words
	8e0c0289eb2a5ea9aa66d3cfe78dadaf words
	$

Note: If the files are identical, try running it again.

• DTrace system calls made by node for the file.js app

	$ sudo dtrace -q -x temporal -n 'syscall:::entry/pid == $target/{printf("%s\n", probefunc);}' -c "node file.js"
	tmp/words.save
	md5sum = 8e0c0289eb2a5ea9aa66d3cfe78dadaf
	mmap  <-- list of system calls made by "node file.js"
	setcontext
	getrlimit
	getpid
	...

• Showing all of the system calls yields too much output
• Closer look at program show it removes old files, then pipes
input to output file, calculating checksum as it goes

• Use DTrace to only look at “interesting” system calls

	sudo dtrace -q -x temporal -n 'syscall::read:entry,syscall::write:entry,syscall::unlink*:entry/ pid == $target/{printf("%s\n", probefunc);}' -c "node file.js" tmp/words.save
	md5sum = 8e0c0289eb2a5ea9aa66d3cfe78dadaf
	write
	read
	write
	read
	...
	unlink
	...

So removing old files completed after the process started reading/writing data.

• Let’s only look at read/write on the files of interest, and print the name of the file(s) being unlinked.
We'll use a DTrace script for this.

	$ sudo ./rwu.d -c "node file.js"
	Password:
    tmp/words.save md5sum =
    8e0c0289eb2a5ea9aa66d3cfe78dadaf
    unlinking tmp
	...
    read request 65536 bytes
    unlinking tmp/words.save
    read request 65536 bytes
	...
    read request 65536 bytes

• Add DTrace probes to file.js, using the following:

	var d = require('dtrace-provider');
    var dtp = d.createDTraceProvider('fileapp');
    dtp.addProbe('rimraf', 'char *');
    dtp.addProbe('srcstream', 'char *');
    dtp.addProbe('chksum', 'char *', 'int');

In file.js:

• Before: rimraf("tmp", function (err2) {
	dtp.fire('rimraf', function(p) {
	! ! return['callingrimraf','now']; ! });
• Before: srcstream.pipe(toStream);
	dtp.fire('srcstream', function(p) {
	! ! ! return['srcstream.pipe(toStream);'] ! ! });
• Before: md5sum.update(chunk);
	dtp.fire('chksum', function(p) {
	! return ['md5sum.update(chunk)', i]; ! });
•Before: copyFile("words", "words.save");
	dtp.enable();

	cp file.js file_probe.js

The file_probe.js contains a version of file.js with the DTrace probes added.

The file_probes.d script traces the probes that were added to file.js.

	$ sudo ./file_probes.d -q -Z -c "node file_probes.js"
    Password:
    tmp/words.save md5sum = 8e0c0289eb2a5ea9aa66d3cfe78dadaf
    calling rimraf
    md5sum.update(chunk)
    md5sum.update(chunk)
    md5sum.update(chunk)
    md5sum.update(chunk)
    md5sum.update(chunk)
    srcstream.pipe(toStream);
    md5sum.update(chunk)
    md5sum.update(chunk)
	...

•The bug:
	• The program starts doing the checksum before it starts the pipe from source stream to destination stream

• A Solution
		• Add pause/resume calls on the source stream • See file_good.js

• Examine the code then execute file_probes.good.js with file_probes.d script

