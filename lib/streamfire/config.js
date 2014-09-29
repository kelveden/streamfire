exports.loadConfig = function () {
    var fs = require('fs'),
        homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
        config = JSON.parse(fs.readFileSync(homeDir + "/.streamfire/config.json", "utf8"));

    if (!config) {
        console.log("Could not load configuration.");
        process.exit(1);
    }

    return config;
};
