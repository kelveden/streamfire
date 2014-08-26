exports.configure = function (config, campfire) {
    return {
        open: campfire.openRoomStream
    };
};

