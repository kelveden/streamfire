var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    moment = require('moment'),
    users = {};

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

    function printMessages(messages) {
        function isTextMessage(message) {
            return (message.type === 'TextMessage') || (message.type === 'PasteMessage');
        }

        function printTextMessage(user, message) {
            var body = message.body,
                isMultiline = (body.indexOf('\n') > 0),
                created = moment(message.created_at).startOf('day').isSame(moment().startOf('day')) ?
                    moment(message.created_at).format("HH:mm:ss") :
                    moment(message.created_at).calendar();

            console.log(user.name.cyan + " [" + created.green + "]:" + (isMultiline ? "\n" : " ") + body);
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
        console.log("Opening stream from room...".yellow);

        return inStream.open(roomId)
            .pipe(es.mapSync(printMessages));
    }

    function openRoomStreamOut() {
        console.log("Opening stream to room...".yellow);

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
