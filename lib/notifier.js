var growl = require('growl'),
    when = require('when'),
    _ = require('lodash');

module.exports = function (config) {
    var campfire = config.campfire,
        userRegistry = config.userRegistry,
        userConfig = config.userConfig;

    /**
     * Sends an alert based on the specified message.
     *
     * Returns a promise;
     */
    this.notify = function (message) {
        if ((message.type !== 'TextMessage') && (message.type !== 'PasteMessage')) {
            return when.resolve();
        }

        if (!userConfig.alertOn) {
            var body = message.body;

            function matchesBody (regexp) {
                return regexp.test(body);
            }

            if (!userConfig.alertOn.some(matchesBody)) {
                return when.resolve();
            }
        }

        var userId = message.user_id,
            user;

        return userRegistry.getUser(userId)
            .then(function (userObj) {
                user = userObj;
                return userObj;
            })
            .then(campfire.downloadAvatarFor)
            .then(function (path) {
                growl(user.name + ": " + message.body, { title: "Streamfire", image: path });
            });
    };
};

