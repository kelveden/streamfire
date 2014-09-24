var when = require('when'),
    _ = require('lodash');

module.exports = function (config) {
    var campfire = config.campfire,
        users = {};

    /**
     * Gets the user with the specified id from the registry. If the user does not exist it is loaded from Campfire.
     *
     * Returns a promise;
     */
    this.getUser = function (id) {
        if (users[id]) {
            return when.resolve(users[id]);

        } else {
            return campfire.getUser(id)
                .then(function (user) {
                    users[id] = user;
                    return user;
                });
        }
    };

    /**
     * Gets all users with names starting with the specified text.
     */
    this.search = function (text) {
        var lineMatcher = new RegExp("^" + text, "i");

        return _.values(users).filter(function (user) {
            return lineMatcher.test(user.name);
        });
    };
};
