/* jshint expr:true */
var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    UserRegistry = require('../lib/user-registry'),
    when = require('when');

describe("user registry", function () {
    it("will retrieve a user from campfire if it does not exist in the registry", function () {
        var campfire = {
                getUser: sinon.stub().returns({
                    then: function (f) {
                        return when.resolve(f({ user_id: 1234 }));
                    }
                })
            },
            userRegistry = new UserRegistry({ campfire: campfire });

        userRegistry.getUser(1234)
            .then(function (user) {
                expect(user.user_id).to.equal(1234);
                return userRegistry.getUser(1234);
            })
            .then(function (user) {
                expect(user.user_id).to.equal(1234);
                expect(campfire.getUser.callCount).to.equal(1);
            });
    });
});
