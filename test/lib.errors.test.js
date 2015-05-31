/**
 * Dependencies.
 */
var app = require('../index');
var errors = app.errors;
var expect = require('chai').expect;
var utils = require('../test/utils.js')();

/**
 * Tests.
 */
describe('lib.errors.test.js', function() {

  it('BadRequest', function() {
    var e = new errors.BadRequest('message');
    expect(e).to.have.property('message', 'message');
    expect(e).to.have.property('code', 400);
    expect(e).to.have.property('type', 'bad_request');
  });

  it('ValidationFailed', function() {
    var e = new errors.ValidationFailed();
    expect(e).to.have.property('message', 'Missing required fields');
  });

  it('Unauthorized', function() {
    var e = new errors.Unauthorized('message');
    expect(e).to.have.property('message', 'message');
  });

  it('Forbidden', function() {
    var e = new errors.Forbidden('message');
    expect(e).to.have.property('message', 'message');
  });

  it('SpamDetected', function() {
    var e = new errors.SpamDetected('message');
    expect(e).to.have.property('message', 'message');
  });

  it('NotFound', function() {
    var e = new errors.NotFound('message');
    expect(e).to.have.property('message', 'message');
  });

  it('ServerError', function() {
    var e = new errors.ServerError('message');
    expect(e).to.have.property('message', 'message');
  });

  it('Timeout', function() {
    var e = new errors.Timeout('message');
    expect(e).to.have.property('code', 408);
  });

  it('ConflictError', function() {
    var e = new errors.ConflictError('message');
    expect(e).to.have.property('message', 'message');
  });

  it('CustomError', function() {
    var e = new errors.CustomError(123, 'type', 'message');
    expect(e).to.have.property('message', 'message');
    expect(e).to.have.property('type', 'type');
    expect(e).to.have.property('code', 123);
  });

});
