var syscalls = require('syscalls');

syscalls.write(1, 'Hello!\n');

var data = syscalls.read(0, 1024);
syscalls.write(1, "You typed: " + data);