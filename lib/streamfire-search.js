var colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    Campfire = require('./streamfire/campfire'),
    Printer = require('./streamfire/printer'),
    UserRegistry = require('./streamfire/user-registry'),
    roomResolver = require('./streamfire/room-resolver');

exports.run = function (argv) {
    require('./streamfire/debug').setup(argv[2]);

    var term = argv[1],
        userConfig = require('./streamfire/config').loadConfig(),
        campfire = new Campfire({ url: util.format('https://%s', userConfig.domain),
            userConfig: userConfig
        }),
        debug = (argv[2] === "debug"),
        roomId = roomResolver.resolve(argv[0], { campfire: campfire, userConfig: userConfig }),
        userRegistry = new UserRegistry({ campfire: campfire }),
        printer = new Printer({
            userRegistry: userRegistry,
            out: process.stdout,
            locale: userConfig.locale
        });

    if (_.isString(roomId)) {
        campfire.search(roomId, term)
            .then(printer.printMessages)
            .catch(function (e) {
                console.error(e);
                process.exit(1);
            })
            .done();
    }
};
