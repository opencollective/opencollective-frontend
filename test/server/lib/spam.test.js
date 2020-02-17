import { expect } from 'chai';
import sinon from 'sinon';
import slackLib from '../../../server/lib/slack';
import { collectiveSpamCheck, notifyTeamAboutSuspiciousCollective } from '../../../server/lib/spam';

describe('server/lib/spam', () => {
  describe('collectiveSpamCheck', () => {
    it('detects bad keywords', async () => {
      // Description
      expect(collectiveSpamCheck({ description: 'Some keto stuff' })).to.deep.eq({
        score: 0.25,
        keywords: ['keto'],
        domains: [],
      });

      // Long description
      expect(collectiveSpamCheck({ longDescription: 'Some PORN stuff' })).to.deep.eq({
        score: 0.25,
        keywords: ['porn'],
        domains: [],
      });

      // Website
      expect(collectiveSpamCheck({ website: 'https://maxketo.com' })).to.deep.eq({
        score: 0.25,
        keywords: ['keto'],
        domains: [],
      });

      // Name
      expect(collectiveSpamCheck({ name: 'BEST KeTo!!!' })).to.deep.eq({
        score: 0.25,
        keywords: ['keto'],
        domains: [],
      });
    });

    it('detects blacklisted websites', async () => {
      // Website
      expect(collectiveSpamCheck({ website: 'https://supplementslove.com/promotion' })).to.deep.eq({
        score: 1,
        keywords: [],
        domains: ['supplementslove.com'],
      });
    });
  });

  describe('notifyTeamAboutSuspiciousCollective', () => {
    let slackPostMessageStub = null;

    before(() => {
      slackPostMessageStub = sinon.stub(slackLib, 'postMessage');
    });

    after(() => {
      slackPostMessageStub.restore();
    });

    it('notifies Slack with the report info', async () => {
      await notifyTeamAboutSuspiciousCollective({ name: 'Keto stuff', slug: 'ketoooo' });
      expect(slackPostMessageStub.calledOnce).to.be.true;

      const args = slackPostMessageStub.getCall(0).args;
      expect(args[0]).to.eq(
        '*Suspicious collective data was submitted for collective:* https://opencollective.com/ketoooo\nScore: 0.25\nKeywords: `keto`',
      );
      expect(args[2].channel).to.eq('#abuse');
    });
  });
});
