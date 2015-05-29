var pingpong = require('pingpong');

pingpong.client({ port : 8000 }, function (err, remote) {
  remote.invoke('ping', function (err, result) {
    console.log(result);
    process.exit(0);
  });
});
