var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.config('control:altitude_max', 4000);

client.takeoff();

client
  .after(1000, function() {
     this.up(6);
  })
  .after(2000, function() {
    this.animate('flipLeft', 15);
  })
  .after(4000, function() {
    this.stop();
    this.land();
  });
