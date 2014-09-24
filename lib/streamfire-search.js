var colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    Campfire = require('./campfire'),
    Printer = require('./printer'),
    UserRegistry = require('./user-registry'),
    roomResolver = require('./room-resolver');

exports.run = function (argv) {
    var term = argv[1],
        userConfig = require('./config').loadConfig(),
        campfire = new Campfire({ url: util.format('https://%s.campfirenow.com', userConfig.domain),
            userConfig: userConfig
        }),
        roomId = roomResolver.resolve(argv[0], { campfire: campfire, userConfig: userConfig }),
        userRegistry = new UserRegistry({ campfire: campfire }),
        printer = new Printer({
            userRegistry: userRegistry,
            out: process.stdout,
            locale: userConfig.locale
        });

    if (roomId) {
        campfire.search(roomId, term)
            .then(printer.printMessages)
            .catch(function (e) {
                console.error(e);
                process.exit(1);
            })
            .done();
    }
};
