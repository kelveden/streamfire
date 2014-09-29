var growl = require('growl');

/**
 * Wrapper for the growl lib to allow for stubbing in tests.
 */
exports.growl = function (args) {
    growl.apply(this, Array.prototype.slice.call(arguments));
};
