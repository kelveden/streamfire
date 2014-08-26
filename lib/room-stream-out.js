var request = require('request'),
    readline = require('readline'),
    colors = require('colors');

exports.configure = function (campfire) {

    function displayHelp() {
        console.log(
                "Ctrl-C".green + " - Exit; " +
                "F1".green + " - Help; " +
                "F2".green + " - Room Occupants;");
    }

    function listOccupants(roomId) {
        campfire.getRoom(roomId)
            .done(function (room) {
                room.users.forEach(function (user) {
                    console.log(user.name.green);
                });
            });
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
                    } else if (key.name === 'f2') {
                        listOccupants(roomId);
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


