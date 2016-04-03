//  /Applications/muse/muse-io --osc osc.udp://localhost:3333 --dsp --device Muse

var osc = require('node-osc');
var io = require('socket.io').listen(3333);
//var gui = require('socket.io').listen(5000);

///////////////////////////////////////////////////////////////////////////////////
//GUI stuff
/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var randomizer = require('./randomizer');
var app = express();

// all environments
app.set('port', process.env.PORT || 5000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//create the server
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//Socket IO specifics
io = require('socket.io').listen(server, { log: false });
io.sockets.on('connection', function (socket) {
    var interval = setInterval(function() {
        var data = getConcentrationData(); //randomizer.getRandomData();
        socket.emit('dataSet', data); // concentration 
        socket.emit('movingMessage', moving);
        socket.emit('turningMessage', turning);
    }, 1);
    socket.on('updateInterval', function (intervalData) {
        //Update the interval that is coming from the client
        clearInterval(interval);
        interval = setInterval(function() {
            var data = getConcentrationData(); //randomizer.getRandomData();
            socket.emit('dataSet', data);
            socket.emit('movingMessage', moving);
            socket.emit('turningMessage', turning);
        }, intervalData);
    });
});

// get the concentration data
var data = [];
var totalPoints = 300;
function getConcentrationData() {
    if (data.length > 0) {
        data = data.slice(1);
    }

    // Zip the generated y values with the x values
    var res = [];
    for (var i = 0; i < data.length; ++i) {
        res.push([i, data[i]])
    }

}
/////////////////////////////////////////////////////////////////////////////////////////////


var oscServer, oscClient;

/* Configure and make connection with drone (client) */
var arDrone = require('ar-drone');
var client = arDrone.createClient();
client.config('control:altitude_max', 3000);

var inFlight = false; // whether or not the drone is in flight 
var clenchTime = 0; // is this used?

/* make the drone take off */
function handleTakeoff() {
  if(!inFlight) {
    console.log("take off");
    client.takeoff();
    inFlight = true;
  }
}

/* Kill the drone */
function kill() {
  console.log("land");
  //client.stop();
  client.land();
  inFlight = false;
}

var pitchNormal = undefined;
var rollNormal = undefined;
var moving = "not moving";
var turning = "not turning";

/* 
 * This takes a value and compares it the the normal for head tilt left or right
 * tile left => rotate counterclockwise 
 * tilt right => 
 */
function handleTurn(value) {
  if (rollNormal == undefined) {
    rollNormal = value;  
    console.log(rollNormal); 
  }
  else {
    var difference = (value > rollNormal);
    var amount = Math.min(Math.abs(value - rollNormal) / 700, 1); //valuedifference to a value between 0 - 1,

    if (amount > 0.3) {
      if (difference) {
        console.log("clockwise rotation: " + (amount));// client.clockwise(amount);
        client.clockwise(amount);
        turning = "turning right";
      } 
      else {
        console.log("counter-clockwise rotation: " + (amount));// client.counterClockwise(amount);
        client.counterClockwise(amount);
        turning = "turning left";
      }
    }
    else {
        turning = "not turning";
    }
  }
}

/* 
 * This takes a value and compares it the the normal for head up or down
 * down => move forwards 
 * up => move backwards
 */
function handleMove(value) {
  if (pitchNormal == undefined) {
    pitchNormal = value;    
  }
  else {
    var difference = (pitchNormal > value);
    var amount = Math.min(Math.abs(value - pitchNormal) / 800, 1); 

    if (amount > 0.3 && (!difference)) {
        console.log("move forwards: " + (0.1));//client.front(amount);
        client.front(0.1);  
        moving = "moving forwards";    
    }
    else if (amount > 0.125 && difference)
    {
        console.log("move backwards: " + (0.1));//client.back(amount);
        client.back(0.1);
        moving = "moving backwards";
    }
    else {
        moving = "not moving";
    }
  }
}

/* muse hanndler */
var Muse = {
    eeg : {
      channels: function(obj){
      },
      quantization: function(obj){
      },
      dropped: function(obj){
      }
    },
    relative : {
      alpha: function(obj) {
        Muse.relative.brainwave('alpha', obj);
      },
      beta: function(obj) {
        Muse.relative.brainwave('beta', obj);
      },
      delta: function(obj) {
        Muse.relative.brainwave('delta', obj);
      },
      gamma: function(obj) {
        Muse.relative.brainwave('gamma', obj);
      },
      theta: function(obj) {
        Muse.relative.brainwave('theta', obj);
      },
          'brainwave' : function( band, obj) {
          }
      },
      absolute: {
        low_freq: function(obj){
        },
        alpha: function(obj) {
          Muse.absolute.brainwave('alpha', obj);
        },
        beta: function(obj) {
          Muse.absolute.brainwave('beta', obj);
        },
        delta: function(obj) {
          Muse.absolute.brainwave('delta', obj);
        },
        gamma: function(obj) {
          Muse.absolute.brainwave('gamma', obj);
        },
        theta: function(obj) {
          Muse.absolute.brainwave('theta', obj);
        },
        brainwave : function( band, obj) {              
        }
      },
      session: {
        alpha: function(obj){
          Muse.session.brainwave('alpha', obj);
        },
        beta: function(obj){
          Muse.session.brainwave('beta', obj);
        },
        delta: function(obj){
          Muse.session.brainwave('delta', obj);
        },
        gamma: function(obj){
          Muse.session.brainwave('gamma', obj);
        },
        theta: function(obj){
          Muse.session.brainwave('theta', obj);
        },
        brainwave: function(band, obj){
        }
      },
      experimental: {
        mellow: function (obj){  
              //console.log(obj);             
        },
        concentration: function(obj){
            data.push(obj[1]); // push concentration value into array for visualization     

            console.log("Concentration : " + obj[1]);
            //console.log(obj[1]);
            if(obj[1] > 0.6) {
                handleTakeoff();
            }
            if(inFlight && (obj[1]<0.35)){
                kill();
            }
        }
      },
      muscle: {
        'blink' : function( obj ){
              //console.log(obj);
        },
        'jaw' : function( obj ){   
              // //console.log(obj);
              // if(obj[1] == 1) {
              //   clenchTime++;
              //   if(clenchTime > 15) {
              //     kill();
              //   }
              // } else {
              //   clenchTime = 0;
              // }
        },
        'takenoff' : function( obj ){
          if(obj[1] == 0) {
            console.log("forehead: " + obj);
            kill();
          }
        }
      },
      raw: {
        fft0: function ( obj ){
        },
        fft1: function ( obj ){
        },
        fft2: function ( obj ){
        },
        fft3: function ( obj ){
        }
      },
      accelerate : function( obj ) {
        handleMove(obj[1]);
        handleTurn(obj[3]);   
        //console.log(obj);
      },
      _handle: {
          '/muse/elements/touching_forehead' : function(obj){
            Muse.muscle.takenoff(obj);
          },
          '/muse/elements/blink' : function(obj){
            Muse.muscle.blink(obj);
          },
          '/muse/elements/jaw_clench' : function(obj){
            Muse.muscle.jaw(obj);
          },
          '/muse/acc' : function(obj){
            Muse.accelerate(obj);
          },
          '/muse/elements/experimental/concentration' : function(obj){
            Muse.experimental.concentration(obj);
          }
      }
};

oscServer = new osc.Server(3333, '127.0.0.1');

oscServer.on('message', function(msg, rinfo) {
  if (Muse._handle[msg[0]]) { Muse._handle[msg[0]](msg) ; } 
  //USE MUSE OBJECT TO GET INFORMATION YOU WANT
  //EMIT THAT TO THE DRONE, IN A FORMAT IT CAN UNDERSTAND.
  });