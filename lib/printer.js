var colors = require('colors'),
    moment = require('moment'),
    campfire = require('./campfire');

moment.locale('en-GB');

module.exports = function (users) {
    return {
        printMessage: function (message) {
            // Yes we really do need to duplicate code here - momentjs mutates the moment with its "startOf" function
            var created = moment(message.created_at, campfire.dateFormat).startOf('day').isSame(moment().startOf('day')) ?
                    moment(message.created_at, campfire.dateFormat).format("HH:mm:ss") :
                    moment(message.created_at, campfire.dateFormat).calendar(),
                user;

            if ((message.type === 'TextMessage') || (message.type === 'PasteMessage')) {
                var body = message.body,
                    isMultiline = (body.indexOf('\n') > 0);

                user = users[message.user_id];

                console.log(user.name.cyan + " [" + created.green + "]:" + (isMultiline ? "\n" : " ") + body);

            } else if (message.type === 'EnterMessage') {
                user = users[message.user_id];
                console.log(user.name.cyan + " [" + created.green + "]: " + "Entered room.".yellow);

            } else if (message.type === 'LeaveMessage') {
                user = users[message.user_id];
                console.log(user.name.cyan + " [" + created.green + "]: " + "Left room.".yellow);
            }
        }
    };
}
