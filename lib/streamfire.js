var es = require('event-stream'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    os = require('os'),
    wrench = require('wrench'),
    moment = require('moment'),
    when = require('when'),
    sequence = require('when/sequence'),
    Campfire = require('./streamfire/campfire'),
    UserRegistry = require('./streamfire/user-registry'),
    RoomOutStream = require('./streamfire/room-out'),
    Printer = require('./streamfire/printer'),
    Notifier = require('./streamfire/notifier'),
    roomResolver = require('./streamfire/room-resolver'),
    workingDir = os.tmpdir() + "/./streamfire/";

exports.run = function (argv) {
    require('./streamfire/debug').setup(argv[1]);

    var userConfig = require('./streamfire/config').loadConfig(),
        campfire = new Campfire({
            url: util.format('https://%s.campfirenow.com', userConfig.domain),
            workingDir: workingDir,
            userConfig: userConfig
        }),
        roomId = roomResolver.resolve(argv[0], { campfire: campfire, userConfig: userConfig }),
        userRegistry = new UserRegistry({
            campfire: campfire
        }),
        notifier = new Notifier({
            campfire: campfire,
            userConfig: userConfig,
            userRegistry: userRegistry,
            workingDir: workingDir
        }),
        outStream = new RoomOutStream({
            campfire: campfire,
            notifier: notifier,
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
        return when.resolve(outStream.open(roomId));
    }

    function ok(result) {
        process.stdout.write(" [" + "OK".green + "]\n");
        return result;
    }

    function loadUsersFromRoom() {
        process.stdout.write("Loading users in room...".yellow);
        return userRegistry.loadFromRoom(roomId)
            .then(ok);
    }

    function loadUsersFromMessages(messages) {
        process.stdout.write("Loading owners of messages...".yellow);

        return userRegistry.loadFromMessages(messages)
            .then(ok);
    }

    function loadRecentMessages() {
        process.stdout.write("Loading recent messages...".yellow);
        return campfire.getRecentMessages(roomId)
            .then(ok);
    }

    function showAlerts() {
        if (userConfig.showTodaysAlertsOnStartup) {
            return campfire.getTranscript(roomId, moment())
                .done(function (messages) {
                    messages.forEach(notifier.notify);
                });
        } else {
            return when.resolve();
        }
    }

    wrench.rmdirSyncRecursive(workingDir, { forceDelete: true });
    wrench.mkdirSyncRecursive(workingDir);

    if (_.isString(roomId)) {
        joinRoom()
            .then(loadUsersFromRoom)
            .then(loadRecentMessages)
            .then(function (messages) {
                return sequence([ loadUsersFromMessages, printer.printMessages ], messages);
            })
            .then(openRoomStreamIn)
            .then(openRoomStreamOut)
            .then(showAlerts)
            .catch(function (e) {
                notifier.notifyInfo("streamfire exited unexpectedly.");
                console.error(e);
                process.exit(1);
            });
    }
};
