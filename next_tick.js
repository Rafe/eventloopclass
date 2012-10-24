var loop = require('./loop');

loop.nextTick(function() {
  console.log("this will print last");
});

console.log("this will print first");

loop.run();