//  /Applications/muse/muse-io --osc osc.udp://localhost:3333 --dsp --device Muse

var osc = require('node-osc'),
    io = require('socket.io').listen(3333);

var oscServer, oscClient;

var arDrone = require('ar-drone');
var client = arDrone.createClient();

client.config('control:altitude_max', 2000);

var inFlight = false;
var clenchTime = 0;

function handleTakeoff() {
  if(!inFlight) {
    console.log("take off");
    client.takeoff();
    inFlight = true;
  }
}

function kill() {
  client.stop();
  client.land();
}

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
              console.log("Concentration : ");
              console.log(obj[1]);
              if(obj[1] > 0.7) {
                handleTakeoff();
              }
              if(inFlight && obj[1]<0.35){
                kill();
              }
        }
      },
      muscle: {
        'blink' : function( obj ){
              //console.log(obj);
        },
        'jaw' : function( obj ){   
              //console.log(obj);
              if(obj[1] == 1) {
                clenchTime++;
                if(clenchTime > 15) {
                  kill();
                }
              } else {
                clenchTime = 0;
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
      accelerate : function( obj ){                 
      },
      _handle: {
          '/muse/elements/alpha_relative' : function(obj){
              Muse.relative.alpha(obj);
          },
          '/muse/elements/beta_relative' : function(obj){
              Muse.relative.beta(obj);
          },
          '/muse/elements/delta_relative' : function(obj){
              Muse.relative.delta(obj);
          },
          '/muse/elements/gamma_relative' : function(obj){
              Muse.relative.gamma(obj);
          },
          '/muse/elements/theta_relative' : function(obj){
              Muse.relative.theta(obj);
          },
          '/muse/elements/low_freqs_absolute' : function(obj){
            Muse.absolute.low_freq(obj);
          },
          '/muse/elements/alpha_absolute' : function(obj){
              Muse.absolute.alpha(obj);
          },
          '/muse/elements/beta_absolute' : function(obj){
              Muse.absolute.beta(obj);
          },
          '/muse/elements/delta_absolute' : function(obj){
              Muse.absolute.delta(obj);
          },
          '/muse/elements/gamma_absolute' : function(obj){
              Muse.absolute.gamma(obj);
          },
          '/muse/elements/theta_absolute' : function(obj){
              Muse.absolute.theta(obj);
          },
          '/muse/elements/delta_session_score' : function(obj){
            Muse.session.delta(obj);
          },
          '/muse/elements/theta_session_score' : function(obj){
            Muse.session.theta(obj);
          },
          '/muse/elements/alpha_session_score' : function(obj){
            Muse.session.alpha(obj);
          },
          '/muse/elements/beta_session_score' : function(obj){
            Muse.session.beta(obj);
          },
          '/muse/elements/gamma_session_score' : function(obj){
            Muse.session.gamma(obj);
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
          '/muse/elements/experimental/mellow' : function(obj){
            Muse.experimental.mellow(obj);
          },
          '/muse/elements/experimental/concentration' : function(obj){
            Muse.experimental.concentration(obj);
          },
          '/muse/elements/raw_fft0' : function(obj){
            Muse.raw.fft0(obj);
          },
          '/muse/elements/raw_fft1' : function(obj){
            Muse.raw.fft1(obj);
          },
          '/muse/elements/raw_fft2' : function(obj){
            Muse.raw.fft2(obj);
          },
          '/muse/elements/raw_fft3' : function(obj){
            Muse.raw.fft3(obj);
          },
          '/muse/eeg' : function(obj){
            Muse.eeg.channels(obj);
          },
          '/muse/eeg/quantization' : function(obj){
            Muse.eeg.quantization(obj);
          },
          '/muse/eeg/dropped_samples' : function(obj){
            Muse.eeg.dropped(obj);
          }
      }
};

oscServer = new osc.Server(3333, '127.0.0.1');

oscServer.on('message', function(msg, rinfo) {
  if (Muse._handle[msg[0]]) { Muse._handle[msg[0]](msg) ; }
  //USE MUSE OBJECT TO GET INFORMATION YOU WANT
  //EMIT THAT TO THE DRONE, IN A FORMAT IT CAN UNDERSTAND.
  });