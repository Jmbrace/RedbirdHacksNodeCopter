/**
 * Starts the client and server pushing functionality
 */
 var startClientServer = function() {

    //Get the URL to hand into the connect call
    var http = location.protocol;
    var slashes = http.concat("//");
    var host = slashes.concat(window.location.hostname);

    //Socket IO communications
    var socket = io.connect(host);

    var minBufferSize = 50;
    var maxBufferSize = 300;
    var clientInterval = null;
    var rebuffer = true;
    var serverUpdates = 1;
    var clientUpdates = 30;

    var greenSerie = new TimeSeries();
    var chart = new SmoothieChart();

    // create graph and set up conection to the canvas
    chart.addTimeSeries(greenSerie, { 
      strokeStyle: 'rgba(0, 255, 0, 1)', 
      fillStyle: 'rgba(0, 255, 0, 0.2)', 
      lineWidth: 4 
  });
    chart.streamTo(document.getElementById("chart"), 500);

    // intercept moving status from bridge.js
    socket.on('movingMessage', function (data) {
        $("#movingValue").text(data);
    });
    
    // intercept turning status from bridge.js
    socket.on('turningMessage', function (data) {
        $("#turningValue").text(data);
    });

    // intercept concentration data from bridge.js and add it to the graph stream 
    socket.on('concentration', function (data) {
        greenSerie.append(new Date().getTime(), data);
    });
    
    //Add text to the controls
    $("#updateInterval").val(clientUpdates);
    $("#serverInterval").val(serverUpdates);

    //Client side, wake up an _independent_ amount of time
    //from the server and try to repaint.  This gives us a smooth
    //animation and nothing jerky.  You really don't want to put
    //it within the socket call.  Let that "buffer" the data
    //instead.
    clientInterval = setInterval(function () {
        //repaintGraph("#placeholder");
    },clientUpdates);

    /*
     * The browser throttle button was clicked
     */
     $("#clientThrottleButton").click(function(){
        var v = $("#updateInterval").val();
        if (v && !isNaN(+v)) {
            clientUpdates = +v;
            if (clientUpdates < 1) {
                clientUpdates = 1;
                $("#updateInterval").val(clientUpdates);
            }
            $(this).val("" + clientUpdates);
            if(clientInterval) {
                clearInterval(clientInterval);
            }
            clientInterval = setInterval(function () {
                //repaintGraph("#placeholder");
            },clientUpdates);
        }
    });

    /*
     * The server throttle button was clicked
     */
     $("#serverThrottleButton").click(function(){
        var v =  $("#serverInterval").val();
        if (v && !isNaN(+v)) {
            serverUpdates = +v;
            if (serverUpdates < 1) {
                serverUpdates = 1;
                $("#serverInterval").val(serverUpdates);
            }
            $(this).val("" + serverUpdates);
            //Send to the server side that we need data within
            //this interval
            socket.emit('updateInterval', serverUpdates);
        }
    });
 };