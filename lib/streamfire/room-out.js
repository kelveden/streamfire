var request = require('request'),
    readline = require('readline'),
    colors = require('colors'),
    _ = require('lodash'),
    open = require('open');

module.exports = function (config) {
    var campfire = config.campfire,
        userRegistry = config.userRegistry,
        userConfig = config.userConfig;

    function displayHelp(roomId) {
        console.debug("Displaying help...");

        var roomConfig = _.find(userConfig.rooms, { id: parseInt(roomId) }),
            roomDescription = roomConfig ? roomConfig.alias : roomId;

        console.log("Current room: ".green + roomDescription);
        console.log(
                "Ctrl-C".green + " - Exit; " +
                "F1/F12".green + " - Help; " +
                "F2".green + " - Room occupants; " +
                "F3".green + " - Open in browser");
    }

    function listOccupants(roomId) {
        console.debug("Listing occupants of room " + roomId + "...");

        return campfire.getRoom(roomId)
            .done(function (room) {
                _.sortBy(room.users, "name").forEach(function (user) {
                    console.log(user.name.green);
                });
            });
    }

    function openRoomInBrowser(roomId) {
        var url = 'https://' + userConfig.domain + '.campfirenow.com/room/' + roomId;

        console.debug("Opening url " + url + " in browser...");
        open(url);
    }

    this.open = function (roomId) {
        var messageBuffer = "",
            sendingTimeoutId,
            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                completer: function (line) {
                    var matchingUsers = userRegistry.search(line),
                        response = [matchingUsers.map(function (matchingUser) {
                            return matchingUser.name + ": ";
                        }), line];

                    return response;
                },
                terminal: true
            });

        process.stdin.on('keypress', function (ch, key) {
            if (key) {
                if (key.ctrl && (key.name === 'c')) {
                    console.log("Leaving room...".yellow);

                    campfire.leaveRoom(roomId)
                        .done(function () {
                            process.exit();
                        }, function (err) {
                            console.log(err);
                            process.exit();
                        });
                }

                if ((key.name === "f1") || (key.name === "f12")) {
                    displayHelp(roomId);

                } else if (key.name === 'f2') {
                    listOccupants(roomId);

                } else if (key.name === 'f3') {
                    openRoomInBrowser(roomId);
                }
            }
        });

        return rl.on('line', function (line) {
            console.debug("Received line.");

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
    };
};


