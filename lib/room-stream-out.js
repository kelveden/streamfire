var request = require('request'),
    readline = require('readline'),
    colors = require('colors');

exports.configure = function (campfire) {

    function displayHelp() {
        console.log(
                "Ctrl-C".green + " - Exit; " +
                "F1".green + " - Help;");
    }

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
                if (key) {
                    if (key.ctrl && (key.name === 'c')) {
                        process.exit();
                    }

                    if (key.name === "f1") {
                        displayHelp();
                    }
                }
            });

            return rl.on('line', function (line) {
                function sendMessage() {
                    if (messageBuffer.length > 0) {
                        campfire.postMessage(roomId, {
                            type: messageBuffer.indexOf("\n") > -1 ? "PasteMessage" : "TextMessage",
                            body: messageBuffer
                        });
                    }

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


