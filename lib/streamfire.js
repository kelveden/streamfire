var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    moment = require('moment'),
    users = {};

moment.locale('en-GB');

exports.run = function (argv) {
    var roomId = argv[0],
        config = require('./config').loadConfig(),
        campfire = require('./campfire').configure(config),
        inStream = require('./room-stream-in').configure(config, campfire),
        outStream = require('./room-stream-out').configure(config, campfire);

    if (isNaN(roomId)) {
        var roomConfig = _.find(config.rooms, { alias: roomId });
        if (roomConfig) {
            roomId = roomConfig.id.toString();
        } else {
            throw new Error("Could not find room with alias '" + roomId + "'.");
        }
    }

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
                console.log("Alerts will be made on: ".yellow + config.alertOn);

                if (config.alertOn) {
                    config.alertOn = config.alertOn.map(function (textMatch) {
                        return new RegExp(textMatch, "i");
                    });
                }
                return roomId;
            });
    }

    function printMessage(message) {
        if ((message.type === 'TextMessage') || (message.type === 'PasteMessage')) {
            var user = users[message.user_id],
                body = message.body,
                isMultiline = (body.indexOf('\n') > 0),
            // Yes we really do need to duplicate code here - momentjs mutates the moment with its "startOf" function
                created = moment(message.created_at, campfire.dateFormat).startOf('day').isSame(moment().startOf('day')) ?
                    moment(message.created_at, campfire.dateFormat).format("HH:mm:ss") :
                    moment(message.created_at, campfire.dateFormat).calendar();

            console.log(user.name.cyan + " [" + created.green + "]:" + (isMultiline ? "\n" : " ") + body);
        }
    }

    function printMessages(messages) {
        messages.forEach(function (message) {
            printMessage(message);
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
            .pipe(es.mapSync(printMessage));
    }

    function openRoomStreamOut() {
        return outStream.open(roomId);
    }

    function loadUsersFrom(messages) {
        var userIds = _.uniq(_.compact(_.pluck(messages, 'user_id')));

        console.log("Loading users...".yellow);

        return when.all(userIds.map(getUser))
            .then(function () {
                return messages;
            });
    }

    function ensureRoomId() {
        if (isNaN(roomId)) {
            var roomConfig = _.find(config.rooms, { alias: roomId });

            if (roomConfig) {
                roomId = roomConfig.id;
            } else {
                return campfire.getRooms()
                    .then(function (rooms) {
                        console.log("Available rooms:\n");

                        rooms.forEach(function (room) {
                            var roomConfig = _.find(config.rooms, { id: room.id });

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
