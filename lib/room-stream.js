var stream = require('stream'),
    colors = require('colors'),
    util = require('util'),
    when = require('when'),
    request = require('request'),
    users = {};

function getUser(id) {
    if (users[id]) {
        return when.resolve(users[id])

    } else {
        var deferred = when.defer();

        request.get('https://nokia-entertainment.campfirenow.com/users/' + id + '.json', function (error, response, body) {
            if (error) {
                deferred.reject(error);
            } else {
                var user = JSON.parse(body).user;
                users[id] = user;

                deferred.resolve(user);
            }
        }).auth('aba80bf92dc8adb1fe7eb438b3bf8c688de1df1b', 'X');

        return deferred.promise;
    }
}

function RoomStream(options) {
    stream.Writable.call(this, options);
}
util.inherits(RoomStream, stream.Writable);

RoomStream.prototype._write = function (chunk, enc, cb) {
    var string = chunk.toString("UTF8").trim(),
        json;

    try {
        json = JSON.parse(string);
    } catch (e) {
    }

    if (json) {
        getUser(json.user_id)
            .then(function (user) {
                var body = json.body,
                    isMultiline = (body.indexOf('\n') > 0)

                console.log(user.name.cyan + ":" + (isMultiline ? "\n" : " ") + json.body);
            });
    } else {
        if (string.length > 0) {
            console.log("Could not parse: " + string);
        }
    }

    cb();
};

module.exports = RoomStream;


