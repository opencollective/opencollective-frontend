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
describe('lib.errors.test.js', () => {

  it('BadRequest', () => {
    var e = new errors.BadRequest('message');
    expect(e).to.have.property('message', 'message');
    expect(e).to.have.property('code', 400);
    expect(e).to.have.property('type', 'bad_request');
  });

  it('ValidationFailed', () => {
    var e = new errors.ValidationFailed();
    expect(e).to.have.property('message', 'Missing required fields');
  });

  it('Unauthorized', () => {
    var e = new errors.Unauthorized('message');
    expect(e).to.have.property('message', 'message');
  });

  it('Forbidden', () => {
    var e = new errors.Forbidden('message');
    expect(e).to.have.property('message', 'message');
  });

  it('SpamDetected', () => {
    var e = new errors.SpamDetected('message');
    expect(e).to.have.property('message', 'message');
  });

  it('NotFound', () => {
    var e = new errors.NotFound('message');
    expect(e).to.have.property('message', 'message');
  });

  it('ServerError', () => {
    var e = new errors.ServerError('message');
    expect(e).to.have.property('message', 'message');
  });

  it('Timeout', () => {
    var e = new errors.Timeout('message');
    expect(e).to.have.property('code', 408);
  });

  it('ConflictError', () => {
    var e = new errors.ConflictError('message');
    expect(e).to.have.property('message', 'message');
  });

  it('CustomError', () => {
    var e = new errors.CustomError(123, 'type', 'message');
    expect(e).to.have.property('message', 'message');
    expect(e).to.have.property('type', 'type');
    expect(e).to.have.property('code', 123);
  });

});
