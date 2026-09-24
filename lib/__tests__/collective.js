import { CollectiveCategory, OPENSOURCE_COLLECTIVE_ID } from '../../lib/constants/collectives';

import { getCollectiveMainTag } from '../collective';

const UNKNOWN_HOST_ID = 42;

describe('getCollectiveMainTag', () => {
  it('defaults to COLLECTIVE if no known tags or host', () => {
    expect(getCollectiveMainTag()).toBe(CollectiveCategory.COLLECTIVE);
    expect(getCollectiveMainTag(null, [])).toBe(CollectiveCategory.COLLECTIVE);
    expect(getCollectiveMainTag(UNKNOWN_HOST_ID, [])).toBe(CollectiveCategory.COLLECTIVE);
    expect(getCollectiveMainTag(UNKNOWN_HOST_ID, ['strangely-tagged'])).toBe(CollectiveCategory.COLLECTIVE);
  });

  it('returns OPEN_SOURCE for Open Source collective 501c3', () => {
    expect(getCollectiveMainTag(OPENSOURCE_COLLECTIVE_ID)).toBe(CollectiveCategory.OPEN_SOURCE);
  });

  it('gets the category based on tags', () => {
    expect(getCollectiveMainTag(UNKNOWN_HOST_ID, ['cat', 'food', 'open source'])).toBe(CollectiveCategory.OPEN_SOURCE);
    expect(getCollectiveMainTag(UNKNOWN_HOST_ID, ['cat', 'Meetup'])).toBe(CollectiveCategory.MEETUP);
  });
});
