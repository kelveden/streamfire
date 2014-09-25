exports.setup = function (arg) {
    if (arg === "debug") {
        console.debug = function (message) {
            console.log(("[DEBUG]" + message).grey);
        };
    } else {
        console.debug = function () {};
    }
};
