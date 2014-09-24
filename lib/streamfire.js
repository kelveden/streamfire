var request = require('request'),
    es = require('event-stream'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    Campfire = require('./campfire'),
    UserRegistry = require('./user-registry'),
    RoomOutStream = require('./room-out'),
    Printer = require('./printer'),
    roomResolver = require('./room-resolver');

exports.run = function (argv) {
    var userConfig = require('./config').loadConfig(),
        campfire = new Campfire({
            url: util.format('https://%s.campfirenow.com', userConfig.domain),
            userConfig: userConfig
        }),
        roomId = roomResolver.resolve(argv[0], { campfire: campfire, userConfig: userConfig }),
        userRegistry = new UserRegistry({
            campfire: campfire
        }),
        outStream = new RoomOutStream({
            campfire: campfire,
            userRegistry: userRegistry,
            userConfig: userConfig
        }),
        printer = new Printer({
            userRegistry: userRegistry,
            out: process.stdout,
            locale: userConfig.locale
        });

    function joinRoom() {
        console.log("Joining room ".yellow + roomId.green + "...".yellow);

        return campfire.joinRoom(roomId)
            .then(function () {
                console.log("Room joined.".yellow);
                console.log("Alerts will be made on: ".yellow + userConfig.alertOn);

                if (userConfig.alertOn) {
                    userConfig.alertOn = userConfig.alertOn.map(function (textMatch) {
                        return new RegExp(textMatch, "i");
                    });
                }
                return roomId;
            });
    }

    function openRoomStreamIn() {
        function ensureUserLoaded(message, callback) {
            if (message.user_id) {
                userRegistry.getUser(message.user_id)
                    .done(function () {
                        callback(null, message);
                    });
            } else {
                callback(null, message);
            }
        }

        return campfire.openRoomStream(roomId)
            .pipe(es.map(ensureUserLoaded))
            .pipe(es.mapSync(printer.printMessage));
    }

    function openRoomStreamOut() {
        return outStream.open(roomId);
    }

    joinRoom(roomId)
        .then(campfire.getRecentMessages)
        .then(printer.printMessages)
        .then(openRoomStreamIn)
        .then(openRoomStreamOut)
        .catch(function (e) {
            console.error(e);
            process.exit(1);
        });
};
