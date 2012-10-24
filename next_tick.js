var loop = require('./loop');

loop.nextTick(function() {
  loop.nextTick(function() {
    console.log("- THE END -");
  });

  console.log("this will print last");
});

console.log("this will print first");

loop.run();