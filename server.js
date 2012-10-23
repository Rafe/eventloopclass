var syscalls = require('syscalls');

var fd = syscalls.socket(syscalls.AF_INET, syscalls.SOCK_STREAM, 0);

syscalls.bind(fd, 3000, "0.0.0.0");

syscalls.listen(fd, 100);

console.log("Listening on port 3000");

while (true) {
  var connFd = syscalls.accept(fd);
  console.log("Accepted a new connection");

  var data = syscalls.read(connFd, 1024);
  console.log("Received: " + data);

  syscalls.write(connFd, 'bye!\n');

  syscalls.close(connFd);  
}
