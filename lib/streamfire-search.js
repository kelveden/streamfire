var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    campfireBaseUrl = 'https://%s.campfirenow.com';

exports.run = function (argv) {
    var roomId = argv[0],
        term = argv[1],
        userConfig = require('./config').loadConfig(),
        campfire = require('./campfire')
            .configure(util.format(campfireBaseUrl, userConfig.domain), userConfig),
        printer,
        users = {}, messages;

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

    function loadUsersFromMessages() {
        return when.all(
            _.compact(
                _.pluck(messages, 'user_id'))
                .map(getUser));
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

    function printMessages () {
        messages.forEach(printer.printMessage);
    }

    function search () {
        return campfire.search(roomId, term);
    }

    function configurePrinterWithUsers() {
        printer = require('./printer')({
            users: users,
            out: process.stdout,
            locale: userConfig.locale
        });
    }

    ensureRoomId()
        .then(search)
        .then(function (result) {
            messages = result;
        })
        .then(loadUsersFromMessages)
        .then(configurePrinterWithUsers)
        .then(printMessages)
        .catch(function (e) {
            console.error(e);
            process.exit(1);
        })
        .done();
};
