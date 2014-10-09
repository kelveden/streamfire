var _ = require('lodash'),
    util = require('util'),
    Campfire = require('./streamfire/campfire'),
    Printer = require('./streamfire/printer'),
    UserRegistry = require('./streamfire/user-registry'),
    roomResolver = require('./streamfire/room-resolver'),
    moment = require('moment');

exports.run = function (argv) {
    require('./streamfire/debug').setup(argv[2]);

    var userConfig = require('./streamfire/config').loadConfig(),
        campfire = new Campfire({ url: util.format('https://%s', userConfig.domain),
            userConfig: userConfig
        }),
        roomId = roomResolver.resolve(argv[0], { campfire: campfire, userConfig: userConfig }),
        userRegistry = new UserRegistry({ campfire: campfire }),
        printer = new Printer({
            userRegistry: userRegistry,
            out: process.stdout,
            locale: userConfig.locale,
            campfire: campfire,
            roomId: roomId
        }),
        dayArg = argv[1],
        date;

    if (_.isUndefined(dayArg)) {
        date = moment();
    } else if (_.isNumber(dayArg)) {
        date = moment().subtract(dayArg, 'days');
    } else {
        date = moment(dayArg, "YYYY-MM-DD");
    }

    if (_.isString(roomId)) {
        campfire.getTranscript(roomId, date)
            .then(printer.printMessages)
            .catch(function (e) {
                console.error(e);
                process.exit(1);
            })
            .done();
    }
};
