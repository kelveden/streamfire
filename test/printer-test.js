/* jshint expr:true */
var chai = require('chai'),
    expect = chai.expect,
    streams = require('memory-streams'),
    printer = require('../lib/printer'),
    moment = require('moment');

moment.locale('en-GB');

describe("printer", function () {

    var dummyCreatedAt = "2014-09-21T21:28:00Z";

    it("throws an error if configured without users object", function () {
        var dummyStream = new streams.WritableStream();

        expect(function () {
            new printer({ out: dummyStream });
        }).to.throw(/Users object must be specified/);
    });

    it("throws an error if configured without out stream", function () {
        expect(function () {
            new printer({ users: {} });
        }).to.throw(/Output stream must be specified/);
    });

    it("prints a single line message with user's name", function () {

        var dummyStream = new streams.WritableStream(),
            p = printer({
                users: { user1: { name: "some user" }},
                out: dummyStream
            });

        p.printMessage({
            type: "TextMessage",
            created_at: dummyCreatedAt,
            user_id: "user1",
            body: "My message"
        });

        expect(dummyStream.toString()).to.contain("My message\n");
        expect(dummyStream.toString()).to.contain("some user");
    });

    it("prints a multi-line message with user's name once", function () {
        var dummyStream = new streams.WritableStream(),
            p = printer({
                users: { user1: { name: "some user" }},
                out: dummyStream
            });

        p.printMessage({
            type: "TextMessage",
            created_at: dummyCreatedAt,
            user_id: "user1",
            body: "line1\nline2\nline3\n"
        });

        expect(dummyStream.toString()).to.contain("line1\nline2\nline3\n");
        expect(dummyStream.toString().match(/some user/g).length).to.equal(1);
    });

    it("timestamps each message according to locale", function () {
        var users = { user1: { name: "some user" }},
            createdAt = moment().subtract(1, 'days').hour(22).minute(0).second(0).toISOString(),
            message = { type: "TextMessage", user_id: "user1", body: "some message", created_at: createdAt };

        var enGBStream = new streams.WritableStream(),
            enGBPrinter = printer({
                users: users,
                out: enGBStream,
                locale: "en-GB"
            });

        enGBPrinter.printMessage(message);
        expect(enGBStream.toString()).to.contain("Yesterday at 22:00");


        var deDEStream = new streams.WritableStream(),
            deDEPrinter = printer({
                users: users,
                out: deDEStream,
                locale: "de-DE"
            });

        deDEPrinter.printMessage(message);

        expect(deDEStream.toString()).to.contain("Gestern um 22:00 Uhr");
    });

    it("default locale is en-GB", function () {
        var users = { user1: { name: "some user" }},
            createdAt = moment().subtract(1, 'days').hour(22).minute(0).second(0).toISOString(),
            message = { type: "TextMessage", user_id: "user1", body: "some message", created_at: createdAt };

        var dummyStream = new streams.WritableStream(),
            p = printer({
                users: users,
                out: dummyStream
            });

        p.printMessage(message);
        expect(dummyStream.toString()).to.contain("Yesterday at 22:00");
    });

    it("ignores any message with unsupported type", function () {
        var dummyStream = new streams.WritableStream(),
            p = printer({
                users: { user1: { name: "some user" }},
                out: dummyStream
            });

        p.printMessage({ type: "Bollox", user_id: "user1", body: "some message" });

        expect(dummyStream.toString()).to.equal("");
    });

    it("prints user's name as '?' if unknown", function () {

        var dummyStream = new streams.WritableStream(),
            p = printer({
                users: {},
                out: dummyStream
            });

        p.printMessage({
            type: "TextMessage",
            created_at: dummyCreatedAt,
            user_id: "user1",
            body: "My message"
        });

        expect(dummyStream.toString()).to.match(new RegExp("^"));
    });
});
