var growl = require('./growler'),
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
        function matches (body) {
            return function (regexp) {
                return regexp.test(body);
            };
        }

        if ((message.type !== 'TextMessage') && (message.type !== 'PasteMessage')) {
            return when.resolve();
        }

        if (!userConfig.alertOn) {
            return when.resolve();
        }

        var body = message.body,
            userId = message.user_id,
            user;

        if (!userConfig.alertOn.some(matches(body))) {
            return when.resolve();
        }

        return userRegistry.getUser(userId)
            .then(function (userObj) {
                user = userObj;
                return userObj;
            })
            .then(campfire.downloadAvatarFor)
            .then(function (path) {
                growl.growl(user.name + ": " + message.body, { title: "Streamfire", image: path });
            });
    };
};

