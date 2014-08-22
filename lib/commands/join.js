var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    users = {};

module.exports = function (config, roomId) {
    var campfire = require('../campfire').configure(config),
        inStream = require('../room-stream-in').configure(campfire),
        outStream = require('../room-stream-out').configure(campfire);

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
        console.log("Joining room " + roomId + "...");

        return campfire.joinRoom(roomId)
            .then(function () {
                console.log("Room joined.");
                return roomId;
            });
    }

    function printMessages(messages) {
        function isTextMessage(message) {
            return message.type === 'TextMessage';
        }

        function printTextMessage(user, message) {
            var body = message.body,
                isMultiline = (body.indexOf('\n') > 0);

            console.log(user.name.cyan + ":" + (isMultiline ? "\n" : " ") + body);
        }

        var textMessages = (_.isArray(messages) ? messages : [ messages ]).filter(isTextMessage),
            userIds = _.uniq(_.pluck(textMessages, 'user_id'));

        return when.all(userIds.map(getUser))
            .done(function (users) {
                textMessages.forEach(function (message) {
                    printTextMessage(_.find(users, { id: message.user_id }), message);
                });
            },
            function (e) {
                console.error(e);
            });
    }

    function openRoomStreamIn() {
        console.log("Opening stream from room...");

        return inStream.open(roomId)
            .pipe(es.mapSync(printMessages));
    }

    function openRoomStreamOut() {
        console.log("Opening stream to room...");

        return outStream.open(roomId);
    }

    joinRoom()
        .then(campfire.getRecentMessages)
        .then(printMessages)
        .then(function () {
            openRoomStreamIn(roomId);
            openRoomStreamOut(roomId);
        });
};