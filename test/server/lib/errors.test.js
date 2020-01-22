import errors from '../../../server/lib/errors';
import { expect } from 'chai';

/**
 * Tests.
 */
describe('server/lib/errors', () => {
  it('BadRequest', () => {
    const e = new errors.BadRequest('message');
    expect(e).to.have.property('message', 'message');
    expect(e).to.have.property('code', 400);
    expect(e).to.have.property('type', 'bad_request');
  });

  it('ValidationFailed', () => {
    const e = new errors.ValidationFailed();
    expect(e).to.have.property('message', 'Missing required fields');
  });

  it('Unauthorized', () => {
    const e = new errors.Unauthorized('message');
    expect(e).to.have.property('message', 'message');
  });

  it('Forbidden', () => {
    const e = new errors.Forbidden('message');
    expect(e).to.have.property('message', 'message');
  });

  it('SpamDetected', () => {
    const e = new errors.SpamDetected('message');
    expect(e).to.have.property('message', 'message');
  });

  it('NotFound', () => {
    const e = new errors.NotFound('message');
    expect(e).to.have.property('message', 'message');
  });

  it('ServerError', () => {
    const e = new errors.ServerError('message');
    expect(e).to.have.property('message', 'message');
  });

  it('Timeout', () => {
    const e = new errors.Timeout('message');
    expect(e).to.have.property('code', 408);
  });

  it('ConflictError', () => {
    const e = new errors.ConflictError('message');
    expect(e).to.have.property('message', 'message');
  });

  it('CustomError', () => {
    const e = new errors.CustomError(123, 'type', 'message');
    expect(e).to.have.property('message', 'message');
    expect(e).to.have.property('type', 'type');
    expect(e).to.have.property('code', 123);
  });
});
