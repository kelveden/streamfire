var request = require('request');

exports.configure = function (campfire) {
    return  {
        open: function (roomId) {
            return process.stdin.on('data', function (chunk) {
                var line = chunk.toString().replace(/\n/, '');

                campfire.postMessage(roomId, {
                    type: "TextMessage",
                    body: line
                });
            });
        }
    };
};


