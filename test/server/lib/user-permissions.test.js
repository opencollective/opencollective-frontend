import { expect } from 'chai';
import { canUseFeature } from '../../../server/lib/user-permissions';
import FEATURE from '../../../server/constants/feature';

const validUser = {
  id: 1,
};

const limitedUser = {
  id: 2,
  data: {
    features: {
      ALL: false,
    },
  },
};

describe('server/lib/user-permissions', () => {
  describe('canUseFeature', () => {
    it('always returns false for null users', () => {
      expect(canUseFeature(null)).to.eq(false);
      expect(canUseFeature(null, FEATURE.COMMENTS)).to.eq(false);
      expect(canUseFeature(undefined, FEATURE.COMMENTS)).to.eq(false);
    });

    it('always returns false for limited users', () => {
      expect(canUseFeature(limitedUser, FEATURE.COMMENTS)).to.eq(false);
      expect(canUseFeature(limitedUser, FEATURE.ORDER)).to.eq(false);
      expect(canUseFeature(limitedUser, FEATURE.CONVERSATIONS)).to.eq(false);
    });

    it('returns true if user can use the feature', () => {
      expect(canUseFeature(validUser, FEATURE.COMMENTS)).to.eq(true);
      expect(canUseFeature(validUser, FEATURE.ORDER)).to.eq(true);
      expect(canUseFeature(validUser, FEATURE.CONVERSATIONS)).to.eq(true);
    });

    it('returns false if user cannot use the feature', () => {
      expect(
        canUseFeature({ ...validUser, data: { features: { [FEATURE.COMMENTS]: false } } }, FEATURE.COMMENTS),
      ).to.eq(false);

      expect(canUseFeature({ ...validUser, data: { features: { [FEATURE.COMMENTS]: false } } }, FEATURE.ORDER)).to.eq(
        true,
      );

      expect(canUseFeature({ ...validUser, data: { features: { [FEATURE.ORDER]: false } } }, FEATURE.ORDER)).to.eq(
        false,
      );
    });
  });
});
