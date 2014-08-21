exports.run = function (config, argv) {
    var commandName = argv[0],
        commandArgs = argv.slice(1),
        config = require('./config.js').loadConfig();

    commandArgs.unshift(config);

    require('./commands/' + commandName).apply(this, commandArgs);
};