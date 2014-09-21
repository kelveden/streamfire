var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    campfireBaseUrl = 'https://%s.campfirenow.com',
    users = {};

exports.run = function (argv) {
    var roomId = argv[0],
        userConfig = require('./config').loadConfig(),
        campfire = require('./campfire')
            .configure(util.format(campfireBaseUrl, userConfig.domain), userConfig),
        inStream = require('./room-stream-in').configure(userConfig, campfire),
        outStream = require('./room-stream-out').configure(userConfig, campfire, users),
        printer = require('./printer')({
            users: users,
            out: process.stdout,
            locale: userConfig.locale
        });

    function getUser(id) {
        if (users[id]) {
            return when.resolve(users[id]);

        } else {
            return campfire.getUser(id)
                .then(function (user) {
                    users[id] = user;
                    return user;
                });
        }
    }

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
                getUser(message.user_id)
                    .done(function () {
                        callback(null, message);
                    });
            } else {
                callback(null, message);
            }
        }

        return inStream.open(roomId)
            .pipe(es.map(ensureUserLoaded))
            .pipe(es.mapSync(printer.printMessage));
    }

    function openRoomStreamOut() {
        return outStream.open(roomId);
    }

    function loadUsersFrom(messages) {
        console.log("Loading users...".yellow);

        return campfire.getRoom(roomId)
            .then(function (room) {
                var currentUsers = _.pluck(room.users, "id"),
                    usersWithMessages = _.compact(_.pluck(messages, 'user_id'));

                return _.union(currentUsers, usersWithMessages);
            })
            .then(function (userIds) {
                return when.all(userIds.map(getUser));
            })
            .then(function () {
                return messages;
            }, console.error);
    }

    function ensureRoomId() {
        if (isNaN(roomId)) {
            var roomConfig = _.find(userConfig.rooms, { alias: roomId });

            if (roomConfig) {
                roomId = roomConfig.id;
            } else {
                return campfire.getRooms()
                    .then(function (rooms) {
                        console.log("Available rooms:\n");

                        rooms.forEach(function (room) {
                            var roomConfig = _.find(userConfig.rooms, { id: room.id });

                            console.log(room.id.toString().cyan + ": " + room.name.green +
                                (roomConfig ? (" Alias: \"" + roomConfig.alias + "\"").yellow : ""));
                        });

                        process.exit();

                    });
            }
        }

        roomId = roomId.toString();

        return when.resolve(roomId);
    }

    function printMessages (messages) {
        messages.forEach(printer.printMessage);
    }

    ensureRoomId()
        .then(joinRoom)
        .then(campfire.getRecentMessages)
        .then(loadUsersFrom)
        .then(printMessages)
        .then(openRoomStreamIn)
        .then(openRoomStreamOut)
        .catch(function (e) {
            console.error(e);
            process.exit(1);
        });
};
