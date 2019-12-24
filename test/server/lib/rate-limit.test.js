import { expect } from 'chai';
import { randStr } from '../../test-helpers/fake-data';
import RateLimit from '../../../server/lib/rate-limit';

describe('server/lib/rate-limit', () => {
  it('limits the calls with registerCall', async () => {
    const rateLimit = new RateLimit(randStr(), 2);

    expect(await rateLimit.getCallsCount()).to.equal(0);

    expect(await rateLimit.registerCall()).to.equal(true);
    expect(await rateLimit.getCallsCount()).to.equal(1);
    expect(await rateLimit.hasReachedLimit()).to.equal(false);

    expect(await rateLimit.registerCall()).to.equal(true);
    expect(await rateLimit.getCallsCount()).to.equal(2);
    expect(await rateLimit.hasReachedLimit()).to.equal(true);

    expect(await rateLimit.registerCall()).to.equal(false);
    expect(await rateLimit.getCallsCount()).to.equal(2);

    await rateLimit.reset();
    expect(await rateLimit.getCallsCount()).to.equal(0);
  });
});
