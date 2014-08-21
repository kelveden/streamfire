var request = require('request'),
    RoomStream = require('../room-stream');

module.exports = function (room) {
    console.log("Joining room " + room + "...");

    request.get('https://streaming.campfirenow.com/room/' + room + '/live.json')
        .auth('aba80bf92dc8adb1fe7eb438b3bf8c688de1df1b', 'X')
        .pipe(new RoomStream());
};