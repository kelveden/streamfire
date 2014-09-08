/* jshint expr:true */
var expect = require('chai').expect,
    sinon = require('sinon'),
    request = require('request');

describe("campfire client", function () {
    var campfire = require('../lib/campfire').configure({
        domain: "somedomain",
        apiToken: "sometoken"
    });

    describe("getUser", function () {
        var getStub;

        beforeEach(function () {
            getStub = sinon.stub(request, "get");
        });

        afterEach(function () {
            getStub.restore();
        });

        it("passes on parameters in request", function () {
            var stub = getStub.returns({
                auth: function () {
                }
            });

            campfire.getUser("someuserid");

            expect(stub.calledWith('https://somedomain.campfirenow.com/users/someuserid.json'));
        });

        it("passes on correct authorization metadata with request", function () {
            var stub = sinon.stub();

            getStub.returns({
                auth: stub
            });

            campfire.getUser("someuserid");

            expect(stub.calledWith("sometoken", "X"));
        });
    });
});
