var request = require('request'),
    JSONStream = require('JSONStream'),
    when = require('when'),
    through2 = require('through2'),
    growl = require('growl'),
    util = require('util'),
    qs = require('querystring');

module.exports = function (config) {
    var userConfig = config.userConfig,
        baseUrl = config.url;

    function responseResolver(deferred, bodyParser) {
        return function (error, response, body) {
            if (error) {
                deferred.reject(error);
            } else {
                if (bodyParser) {
                    deferred.resolve(bodyParser(body));
                } else {
                    deferred.resolve();
                }
            }
        };
    }

    this.dateFormat = "YYYY/MM/DD HH:mm:ss ZZ";

    /**
     * Gets the details for the specified user. Returns a promise.
     */
    this.getUser = function (userId) {
        var deferred = when.defer();

        request.get(util.format('%s/users/%s.json', baseUrl, userId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).user;
            }))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the details for the specified room. Returns a promise.
     */
    this.getRoom = function (roomId) {
        var deferred = when.defer();

        request.get(util.format('%s/room/%s.json', baseUrl, roomId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).room;
            }))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the details for all rooms visible to the user. Returns a promise.
     */
    this.getRooms = function () {
        var deferred = when.defer();

        request.get(util.format('%s/rooms.json', baseUrl),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).rooms;
            }))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Sends a join request to the specified Campfire room. Returns a promise.
     */
    this.joinRoom = function (roomId) {
        var deferred = when.defer();

        request.post(util.format('%s/room/%s/join.json', baseUrl, roomId),
            responseResolver(deferred))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Sends a leave request to the specified Campfire room. Returns a promise.
     */
    this.leaveRoom = function (roomId) {
        var deferred = when.defer();

        request.post(util.format('%s/room/%s/leave.json', baseUrl, roomId),
            responseResolver(deferred))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the most recent messages for the specified room. Returns a promise.
     */
    this.getRecentMessages = function (roomId) {
        var deferred = when.defer();

        request.get(util.format('%s/room/%s/recent.json', baseUrl, roomId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).messages;
            }))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Posts the specified message to the specified room.
     */
    this.postMessage = function (roomId, message) {
        var deferred = when.defer();

        request.post({
            url: util.format('%s/room/%s/speak.json', baseUrl, roomId),
            auth: {
                user: userConfig.apiToken,
                pass: 'X'
            },
            json: {
                message: message
            }
        }, responseResolver(deferred));

        return deferred.promise;
    };

    /**
     * Searches all rooms for the specified term.
     */
    this.search = function (roomId, term) {
        var deferred = when.defer(),
            url = util.format('%s/search?', baseUrl) + qs.stringify({
                q: term,
                format: "json"
            });

        request.get(url,
            responseResolver(deferred, function (body) {
                return JSON.parse(body).messages.filter(function (message) {
                    return message.room_id === parseInt(roomId);
                }).reverse();
            }))
            .auth(userConfig.apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Opens a stream to the specified room.
     */
    this.openRoomStream = function (roomId) {
        return request.get('https://streaming.campfirenow.com/room/' + roomId + '/live.json')
            .auth(userConfig.apiToken, 'X')
            .pipe(JSONStream.parse())
            .pipe(through2.obj(function (data, enc, callback) {
                if (userConfig.alertOn) {
                    var body = data.body;

                    if (userConfig.alertOn.some(function (regexp) {
                        return regexp.test(body);
                    })) {
                        growl(data.body, { title: "Streamfire" });
                    }
                }

                this.push(data);

                callback();
            }));
    };
};
