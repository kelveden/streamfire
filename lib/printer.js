var colors = require('colors'),
    moment = require('moment'),
    campfire = require('./campfire');

module.exports = function (config) {
    var users = config.users,
        out = config.out,
        locale = config.locale || 'en-GB';

    moment.locale(locale);

    if (!users) throw new Error("Users object must be specified.");
    if (!out) throw new Error("Output stream must be specified.");

    function userToString (user) {
        return user ? user.name.cyan : "?".red;
    }

    return {
        printMessage: function (message) {
            // Yes we really do need to duplicate code here - momentjs mutates the moment with its "startOf" function
            var createdAtDate = new Date(message.created_at),
                createdAt = moment(createdAtDate),
                messageCreatedToday = moment(createdAtDate).startOf('day')
                    .isSame(moment().startOf('day')),
                createdText = messageCreatedToday ?
                    createdAt.format("HH:mm:ss") :
                    createdAt.calendar(),
                user;

            if ((message.type === 'TextMessage') || (message.type === 'PasteMessage')) {
                var body = message.body,
                    isMultiline = (body.indexOf('\n') > 0);

                user = users[message.user_id];

                out.write(userToString(user) + " [" + createdText.green + "]:" + (isMultiline ? "\n" : " ") + body + "\n");

            } else if (message.type === 'EnterMessage') {
                user = users[message.user_id];
                out.write(userToString(user) + " [" + createdText.green + "]: " + "Entered room.".yellow + "\n");

            } else if (message.type === 'LeaveMessage') {
                user = users[message.user_id];
                out.write(userToString(user) + " [" + createdText.green + "]: " + "Left room.".yellow + "\n");
            }
        }
    };
};
