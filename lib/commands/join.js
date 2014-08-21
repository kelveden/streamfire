var request = require('request'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    when = require('when'),
    sequence = require('when/sequence'),
    colors = require('colors'),
    _ = require('lodash'),
    users = {};

function getUser (id) {
    if (users[id]) {
        return when.resolve(users[id]);

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

module.exports = function (room) {
    console.log("Joining room " + room + "...");

    request.get('https://nokia-entertainment.campfirenow.com/room/' + room + '/recent.json')
        .auth('aba80bf92dc8adb1fe7eb438b3bf8c688de1df1b', 'X')
        .pipe(JSONStream.parse('messages'))
        .pipe(es.mapSync(printTextMessages));

    request.get('https://streaming.campfirenow.com/room/' + room + '/live.json')
        .auth('aba80bf92dc8adb1fe7eb438b3bf8c688de1df1b', 'X')
        .pipe(JSONStream.parse())
        .pipe(es.mapSync(printTextMessages));

    process.stdin.on('data', function (chunk) {
        var line = chunk.toString().replace(/\n/, '');

        request.post({
            url: 'https://nokia-entertainment.campfirenow.com/room/' + room + '/speak.json',
            auth: {
                user: 'aba80bf92dc8adb1fe7eb438b3bf8c688de1df1b',
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

};