exports.run = function (config, argv) {
    var commandName = argv[0],
        commandArgs = argv.slice(1);

    require('./commands/' + commandName).apply(this, commandArgs);
};