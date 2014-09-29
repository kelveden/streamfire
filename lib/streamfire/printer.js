var colors = require('colors'),
    moment = require('moment'),
    when = require('when'),
    sequence = require('when/sequence');

module.exports = function (config) {
    var userRegistry = config.userRegistry,
        out = config.out,
        locale = config.locale || 'en-GB',
        self = this;

    moment.locale(locale);

    function userToString(user) {
        return user ? user.name.cyan : "?".red;
    }

    this.printMessage = function (message) {
        // Yes we really do need to duplicate code here - momentjs mutates the moment with its "startOf" function
        var createdAtDate = new Date(message.created_at),
            createdAt = moment(createdAtDate),
            messageCreatedToday = moment(createdAtDate).startOf('day')
                .isSame(moment().startOf('day')),
            createdText = messageCreatedToday ?
                createdAt.format("HH:mm:ss") :
                createdAt.calendar();

        if ((message.type === 'TextMessage') || (message.type === 'PasteMessage')) {
            var body = message.body,
                isMultiline = (body.indexOf('\n') > 0);

            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]:" + (isMultiline ? "\n" : " ") + body + "\n");
                });

        } else if (message.type === 'EnterMessage') {
            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]: " + "Entered room.".yellow + "\n");
                });

        } else if (message.type === 'LeaveMessage') {
            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]: " + "Left room.".yellow + "\n");
                });
        }

        return when.resolve();
    };

    this.printMessages = function (messages) {
        function printMessageFunc (message) {
            return function () {
                return self.printMessage(message);
            };
        }

        return sequence(messages.map(printMessageFunc));
    };
};

