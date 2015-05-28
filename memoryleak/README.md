


•A simple program that leaks memory.

	$ node leak2.js &
		[1] 86625
	$ STARTING
	$

• To see the leak, run the following and watch size field for the node process.

	$ prstat -c -s size
	Please wait...
	PID      USERNAME SIZE RSS  STATE PRI NICE  TIME       CPU  PROCESS/NLWP 
	86625 student      23M 14M sleep  59  0        0:00:00  0.5% node/2
	...
	86625 student      25M 16M sleep  1    0        0:00:00  0.6% node/3
	...

• Look at address space for node
	$ pmap -x `pgrep node` | egrep 'heap|total|Kbytes'
	Address     Kbytes     RSS      Anon   Locked Mode   Mapped File
	0882C000 2596        2028   2028        -      rwx--  [ heap ]
	total Kb     **33536**      26472 16128      -
	<-- wait 5 seconds or so...
	$ pmap -x `pgrep node` | egrep 'heap|total|Kbytes'
	Address     Kbytes     RSS    Anon  Locked Mode   Mapped File
	0882C000 2596       2032   2032     -       rwx--  [ heap ]
	total Kb   ** 39664**     33780  23436   -


• Heap is not growing, but address space is. Typically, programs either
grow heap via brk/sbrk(2) system calls, or via mmap(2) with MAP_ANON flag.

• See if anonymous segments are being added by node.

	$ pmap -x `pgrep node` > first
	<-- wait for ~5 seconds
	$ pmap -x `pgrep node` > second
	$ diff first second
	lots of new lines (new memory segments)
	...

• DTrace mmap(2)calls by node

	$ sudo dtrace -n 'syscall::mmap:entry/execname == "node"/ {@[jstack()] = count();}'
	Password:
	dtrace: description 'syscall::mmap:entry' matched 1 probe <-- wait some seconds and then type (ctrl-c)
              libc.so.1`mmap+0x15
	node`_ZN2v88internal15MemoryAllocator20ReserveAlignedMemoryEjjPNS0_13VirtualMemoryE+0x2a
	...
              run at /home/student/nodeconf/leak2.js line 15
              (anon) as (anon) at /home/student/nodeconf/leak2.js line 25
...

• Examine leak2.js at indicated lines to try to find the bug.  Solution is left as an exercise.

