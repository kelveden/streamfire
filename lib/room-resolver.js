var _ = require('lodash');

exports.resolve = function (roomId, config) {

    if (isNaN(roomId)) {
        var roomConfig = _.find(config.userConfig.rooms, { alias: roomId });

        if (roomConfig) {
            roomId = roomConfig.id;
        } else {
            return config.campfire.getRooms()
                .then(function (rooms) {
                    console.log("Available rooms:\n");

                    rooms.forEach(function (room) {
                        var roomConfig = _.find(config.userConfig.rooms, { id: room.id });

                        console.log(room.id.toString().cyan + ": " + room.name.green +
                            (roomConfig ? (" Alias: \"" + roomConfig.alias + "\"").yellow : ""));
                    });

                    process.exit();
                });
        }
    }

    return roomId.toString();
};
