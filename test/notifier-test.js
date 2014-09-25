/* jshint expr:true */
var chai = require('chai'),
    when = require('when'),
    expect = chai.expect,
    sinon = require('sinon'),
    growl = require('../lib/growler'),
    Notifier = require('../lib/notifier');

function dummyUserRegistry(users) {
    return {
        getUser: function (userId) {
            return {
                then: function (f) {
                    return when.resolve(
                        f(users[userId])
                    );
                }
            };
        }
    };
}

function dummyCampfire() {
    return {
        downloadAvatarFor: sinon.stub().returns({
            then: function (f) {
                return when.resolve(
                    f("somepath")
                );
            }
        })
    };
}

describe("notifier", function () {
    it("does not notify if the user does not have an alerts section in config", function (done) {
        var notifier = new Notifier({
            campfire: {},
            userRegistry: {},
            userConfig: {}
        });

        notifier.notify({ type: "TextMessage", body: "somebody" })
            .then(done);
    });

    it("does not notify if the user's alerts do not match the body of the message", function (done) {
        var notifier = new Notifier({
            campfire: {},
            userRegistry: {},
            userConfig: { alertOn: [ /bollox/i ]}
        });

        notifier.notify({ type: "TextMessage", body: "somebody" })
            .then(done);
    });

    it("does not notify if the message is not a TextMessage or PasteMessage", function (done) {
        var notifier = new Notifier({
            campfire: {},
            userRegistry: {},
            userConfig: { alertOn: [ /something/i ] }
        });

        notifier.notify({ type: "BolloxMessage", body: "something" })
            .then(done);
    });

    it("notifies if the message a TextMessage or PasteMessage with a body that matches a user alert", function (done) {
        var notifier = new Notifier({
            campfire: dummyCampfire(),
            userRegistry: dummyUserRegistry({ user1: { name: "user1" } }),
            userConfig: { alertOn: [ /something/i ] }
        });

        growl.growl = sinon.stub();

        notifier.notify({ type: "TextMessage", body: "something", user_id: "user1" })
            .then(function () {
                expect(growl.growl.calledOnce).to.be.true;
                done();
            })
            .done();
    });
});
