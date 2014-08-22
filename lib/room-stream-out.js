var request = require('request'),
    readline = require('readline');

exports.configure = function (campfire) {

    return  {
        open: function (roomId) {
            var messageBuffer = "",
                sendingTimeoutId,
                rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    terminal: true
                });

            process.stdin.on('keypress', function (ch, key) {
                if (key && key.ctrl && key.name == 'c') {
                    process.exit();
                }
            });

            return rl.on('line', function (line) {
                function sendMessage() {
                    campfire.postMessage(roomId, {
                        type: messageBuffer.indexOf("\n") > -1 ? "PasteMessage" : "TextMessage",
                        body: messageBuffer
                    });

                    messageBuffer = "";
                }

                if (sendingTimeoutId) {
                    // Building up a paste.
                    clearTimeout(sendingTimeoutId);
                }

                messageBuffer = messageBuffer +
                    (messageBuffer.length > 0 ? "\n" : "") +
                    line;
                
                sendingTimeoutId = setTimeout(function () {
                    sendMessage();
                }, 100);
            });
        }
    };
};


