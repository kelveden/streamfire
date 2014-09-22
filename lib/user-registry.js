var when = require('when');

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
};
