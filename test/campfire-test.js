/* jshint expr:true */
var chai = require('chai'),
    expect = chai.expect,
    milli = require('milli').configure({ port: 8888 }),
    request = require('request'),
    campfireBaseUrl = 'http://localhost:8888',
    campfire = require('../lib/campfire').configure(campfireBaseUrl, {
        apiToken: "sometoken"
    });

describe("campfire client", function () {
    beforeEach(function (done) {
        milli.clearStubs(done);
    });

    afterEach(function (done) {
        milli.verifyExpectations(done);
    });

    it("getUser pulls user object from response", function (done) {
        var entity = { user: { somefield: "somevalue" } };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/users/someuserid.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getUser("someuserid")
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.user);
                    })
                    .done(done, done);
            });
    });

    it("getRoom pulls room object from response", function (done) {
        var entity = { room: { somefield: "somevalue" } };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/room/someroomid.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getRoom("someroomid")
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.room);
                    })
                    .done(done, done);
            });
    });

    it("getRooms pulls rooms array from response", function (done) {
        var entity = { rooms: [{ somefield: "somevalue" }] };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/rooms.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getRooms()
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.rooms);
                    })
                    .done(done, done);
            });
    });

    it("joinRoom gives no data", function (done) {
        milli.stub(
            milli.expectRequest(
                milli.onPost('/room/someroomid/join.json')
                    .respondWith(200)))

            .run(function () {
                campfire.joinRoom("someroomid")
                    .then(function (data) {
                        expect(data).to.be.undefined;
                    })
                    .done(done, done);
            });
    });

    it("leaveRoom gives no data", function (done) {
        milli.stub(
            milli.expectRequest(
                milli.onPost('/room/someroomid/leave.json')
                    .respondWith(200)))

            .run(function () {
                campfire.leaveRoom("someroomid")
                    .then(function (data) {
                        expect(data).to.be.undefined;
                    })
                    .done(done, done);
            });
    });

    it("getRecentMessages pulls messages array from response", function (done) {
        var entity = { messages: [{ somefield: "somevalue" }] };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/room/someroomid/recent.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getRecentMessages("someroomid")
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.messages);
                    })
                    .done(done, done);
            });
    });
});
