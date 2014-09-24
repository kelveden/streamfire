var es = require('event-stream'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    Campfire = require('./campfire'),
    UserRegistry = require('./user-registry'),
    RoomOutStream = require('./room-out'),
    Printer = require('./printer'),
    Notifier = require('./notifier'),
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
        }),
        notifier = new Notifier({
            campfire: campfire,
            userConfig: userConfig,
            userRegistry: userRegistry
        });

    function joinRoom() {
        process.stdout.write("Joining room ".yellow + roomId.green + "...".yellow);

        return campfire.joinRoom(roomId)
            .then(ok)
            .then(function () {
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
        return campfire.openRoomStream(roomId)
            .pipe(es.map(function (message, callback) {
                printer.printMessage(message);
                notifier.notify(message);
                callback();
            }));
    }

    function openRoomStreamOut() {
        return outStream.open(roomId);
    }

    function ok(result) {
        process.stdout.write(" [" + "OK".green + "]\n");
        return result;
    }

    function loadUsersFromRoom(roomId) {
        process.stdout.write("Loading users in room...".yellow);
        return userRegistry.loadFromRoom(roomId)
            .then(ok);
    }

    function loadUsersFromMessages(messages) {
        process.stdout.write("Loading owners of messages...".yellow);

        return userRegistry.loadFromMessages(messages)
            .then(ok);
    }

    function loadRecentMessages(roomId) {
        process.stdout.write("Loading recent messages...".yellow);
        return campfire.getRecentMessages(roomId)
            .then(ok);
    }

    if (roomId){
        joinRoom(roomId)
            .then(loadUsersFromRoom)
            .then(loadRecentMessages)
            .then(loadUsersFromMessages)
            .then(printer.printMessages)
            .then(openRoomStreamIn)
            .then(openRoomStreamOut)
            .catch(function (e) {
                console.error(e);
                process.exit(1);
            });
    }
};
