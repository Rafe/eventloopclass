var syscalls = require('syscalls');
var dns = require('dns');

var host = process.argv[2];
var port = parseInt(process.argv[3]);

dns.lookup(host, function(err, address, family) {
  if (err) throw err;
  connect(address);
});

function connect(address) {
  var fd = syscalls.socket(syscalls.AF_INET, syscalls.SOCK_STREAM, 0);
  // syscalls.fcntl(fd, syscalls.F_SETFL, syscalls.O_NONBLOCK);
  
  syscalls.connect(fd, port, address);
  
  // syscalls.select([], [fd], []);
  
  while (true) {
    var fds = syscalls.select([0, fd], [], []);
    // fds = [
    //   [readableFds],
    //   [writableFds],
    //   [errorsFds],
    // ]
    var readableFds = fds[0];
  
    if (readableFds.indexOf(0) != -1) {
      // stdin readable
      var data = syscalls.read(0, 1024);
      syscalls.write(fd, data);
    }
  
    if (readableFds.indexOf(fd) != -1) {
      // socket is not readable. Server sent some data.
      var data = syscalls.read(fd, 1024);
      if (data.length == 0) return; // server disconnected.
      syscalls.write(1, data);
    }
  }
}