var request = require('request'),
    es = require('event-stream'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    when = require('when'),
    through2 = require('through2'),
    growl = require('growl'),
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
            .pipe(through2.obj(function (data, enc, callback) {
                var userId = data.user_id,
                    self = this;

                userRegistry.getUser(userId)
                    .then(function (user) {
                        var deferred = when.defer();

                        if (userConfig.alertOn) {
                            var body = data.body;

                            if (userConfig.alertOn.some(function (regexp) {
                                return regexp.test(body);
                            })) {
                                campfire.downloadAvatarFor(user)
                                    .then(function (path) {
                                        growl(data.body, { title: "Streamfire", image: path });
                                    });
                            }
                        }

                        self.push(data);

                        callback();

                        return deferred.promise;
                    });
            }))
            .pipe(es.mapSync(printer.printMessage));
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
};
