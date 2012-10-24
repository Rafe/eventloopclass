var syscalls = require('syscalls');
var loop = require('./loop');
var HTTPParser = require('./http_parser').HTTPParser;

function HttpServer(callback) {
  this.callback = callback;
}

HttpServer.prototype = {
  listen: function(port) {
    this.fd = syscalls.socket(syscalls.AF_INET, syscalls.SOCK_STREAM, 0);
    syscalls.fcntl(this.fd, syscalls.F_SETFL, syscalls.O_NONBLOCK);
    syscalls.bind(this.fd, port, "0.0.0.0");
    syscalls.listen(this.fd, 100);
  },
  
  start: function() {
    var self = this;
    
    loop.on(this.fd, 'read', function() {
      try {
        var connFd = syscalls.accept(self.fd);
      } catch (e) {
        // Another worker already accepted the connection
      }
      if (connFd) {
        new HttpServer.Connection(connFd, self.callback);
      }
    })
  },
  
  fork: function(count) {
    if (syscalls.fork() == 0) {
      console.log("In child process: " + syscalls.getpid());
      this.start();
    } else {
      console.log("In master process: " + syscalls.getpid());
      count--;
      if (count > 0) {
        this.fork(count);
      } else {
        syscalls.waitpid(-1);
      }
    }
  }
}

HttpServer.Connection = function(fd, callback) {
  var self = this;
  this.fd = fd;
  this.callback = callback;
  
  var parser = new HTTPParser(HTTPParser.REQUEST);
  
  loop.on(fd, 'read', function() {
    var data = syscalls.read(fd, 1024);
    
    if (data.length == 0) {
      loop.remove(fd, 'read');
      syscalls.close(fd);
      return;
    }
    
    parser.parse(data);
  })
  
  parser.onMessageComplete = function() {
    loop.remove(fd, 'read');
    
    var request = parser.info;
    console.log(request.method + ' ' + request.url);
    self.callback(request, self);
  }
}

HttpServer.Connection.prototype = {
  send: function(body) {
    var data = "HTTP/1.1 200 OK\r\n" +
               "Content-Type: text/plain\r\n" +
               "Content-Length: " + body.length + "\r\n" +
               "\r\n" +
               body;
    var self = this;
    
    loop.once(this.fd, 'write', function() {
      syscalls.write(self.fd, data);
      syscalls.close(self.fd);
    })
  }
}


var server = new HttpServer(function(request, response) {
  if (request.url == "/slow") {
    var objects = [];
    
    var i=0;
    function compute() {
      for (var j=0; j < 100000; j++, i++) {
        objects.push(new Object()); // pretend we're computing something here
      };
      
      if (i < 10000000) {
        i++;
        loop.nextTick(compute);
      } else {
        response.send("slow request done\n");
      }
    }
    compute();
    
    
  } else {
    response.send("from pid: " + syscalls.getpid() + "\n");
    
  }
});

server.listen(3000);
// server.start();
server.fork(3);

loop.run();


