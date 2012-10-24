var syscalls = require('syscalls');
var loop = require('./loop');

var fd = syscalls.socket(syscalls.AF_INET, syscalls.SOCK_STREAM, 0);
syscalls.fcntl(fd, syscalls.F_SETFL, syscalls.O_NONBLOCK);
syscalls.bind(fd, 3000, "0.0.0.0");
syscalls.listen(fd, 100);

loop.on(fd, 'read', function() {
  var connFd = syscalls.accept(fd);
  
  var code = "";
  loop.on(connFd, 'read', function() {
    var chunk = syscalls.read(connFd, 10240);
    if (chunk.length == 0) {
      syscalls.close(connFd);
      return;
    }
    if (chunk == "\n") evalCode(code);
    code += chunk;
  }
})

function evalCode(code) {  
  if (syscalls.fork() == 0) {
    // In child
    console.log("Running in PID: " + syscalls.getpid());
    var result = eval(code);
    syscalls.write(connFd, JSON.stringify(result) + '\n');
    console.log("Done PID: " + syscalls.getpid());
    process.exit();
    
  } else {
    // In master
    syscalls.close(connFd);
  }
})

loop.run();