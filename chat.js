var syscalls = require('syscalls');

var acceptFd = syscalls.socket(syscalls.AF_INET, syscalls.SOCK_STREAM, 0);
syscalls.fcntl(acceptFd, syscalls.F_SETFL, syscalls.O_NONBLOCK);
syscalls.bind(acceptFd, 3000, "0.0.0.0");
syscalls.listen(acceptFd, 100);

var users = [];

function accept() {
  var connFd = syscalls.accept(acceptFd);
  console.log("User connected on FD: " + connFd);
  users.push(connFd);
  syscalls.write(connFd, 'Welcome!\n');
  return connFd;
}

function readAndBroadcastMessage(fd) {
  var msg = syscalls.read(fd, 1024);
  
  if (msg.length == 0) {
    disconnect(fd);
    return;
  }
  
  users.forEach(function(receiverFd) {
    if (receiverFd != fd) syscalls.write(receiverFd, 'user ' + fd + '> ' + msg);
  });
}

function disconnect(fd) {
  console.log("User disconnected on FD: " + fd);
  syscalls.close(fd);
  users.splice(users.indexOf(fd), 1);
  delete callbacks[fd];
}

var callbacks = {}; // {fd: function() {...}}

callbacks[acceptFd] = function() {
  var userFd = accept();
  
  callbacks[userFd] = function() {
    // user sent a message
    readAndBroadcastMessage(userFd);
  }
}

while (true) {
  var fds = syscalls.select(Object.keys(callbacks), [], []);
  
  var readableFds = fds[0];
  
  readableFds.forEach(function(fd) {
    var callback = callbacks[fd];
    callback();
  });
}


