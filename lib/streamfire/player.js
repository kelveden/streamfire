var exec = require('child_process').exec;

/*
 Play the sound streamed from the specified URL.
 */
exports.playMessage = function (message) {
    console.debug("Playing " + message.url);

    exec("mplayer " + message.url.replace("https://", "http://") + " -really-quiet");
};
