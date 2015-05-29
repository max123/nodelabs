var pingpong = require('pingpong');

pingpong.server(8000, function (err, server) {

  server.onConnect(function (client) {
    client.onMessage(function (text, responder) {
      responder(null, 'pong');
    });
  });

});
