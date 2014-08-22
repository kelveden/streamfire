var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    users = {};

module.exports = function (config, room) {
    var apiToken = config.apiToken,
        domain = config.domain;

    function getUser (id) {
        if (users[id]) {
            return when.resolve(users[id]);

        } else {
            var deferred = when.defer();

            request.get('https://' + domain + '.campfirenow.com/users/' + id + '.json', function (error, response, body) {
                if (error) {
                    deferred.reject(error);
                } else {
                    var user = JSON.parse(body).user;
                    users[id] = user;

                    deferred.resolve(user);
                }
            }).auth(apiToken, 'X');

            return deferred.promise;
        }
    }

    function joinRoom () {
        var deferred = when.defer();

        console.log("Joining room " + room + "...");

        request.get('https://' + domain + '.campfirenow.com/room/' + room + '/join.json', function (error) {
            if (error) {
                deferred.reject(error);
            } else {
                console.log("Room joined.");
                deferred.resolve();
            }
        }).auth(apiToken, 'X');

        return deferred.promise;
    }

    function isTextMessage (message) {
        return message.type === 'TextMessage';
    }

    function printTextMessage(user, message) {

        var body = message.body,
            isMultiline = (body.indexOf('\n') > 0);

        console.log(user.name.cyan + ":" + (isMultiline ? "\n" : " ") + body);
    }

    function printTextMessages (messages) {
        var textMessages = (_.isArray(messages) ? messages : [ messages ]).filter(isTextMessage),
            userIds = _.uniq(_.pluck(textMessages, 'user_id'));

        when.all(userIds.map(getUser))
            .done(function (users) {
                textMessages.forEach(function (message) {
                    printTextMessage(_.find(users, { id: message.user_id }), message);
                });
            },
            function (e) {
                console.error(e);
            });
    }

    function printRecentMessages () {
        var deferred = when.defer();

        request.get('https://' + domain + '.campfirenow.com/room/' + room + '/recent.json')
            .auth(apiToken, 'X')
            .pipe(JSONStream.parse('messages'))
            .pipe(es.mapSync(printTextMessages))
            .on('error', function (e) {
                deferred.reject(e);
            })
            .on('end', function () {
                deferred.resolve();
            });

        return deferred.promise;
    }

    function openRoomStream () {
        request.get('https://streaming.campfirenow.com/room/' + room + '/live.json')
            .auth(apiToken, 'X')
            .pipe(JSONStream.parse())
            .pipe(es.mapSync(printTextMessages))

        return when.resolve();
    }

    function openSendStream () {
        process.stdin.on('data', function (chunk) {
            var line = chunk.toString().replace(/\n/, '');

            request.post({
                url: 'https://' + domain + '.campfirenow.com/room/' + room + '/speak.json',
                auth: {
                    user: apiToken,
                    pass: 'X'
                },
                json: {
                    message: {
                        type: "TextMessage",
                        body: line
                    }
                }
            });
        });

        return when.resolve();
    }

    joinRoom()
        .then(printRecentMessages)
        .then(openRoomStream)
        .then(openSendStream)
};