import { expect } from 'chai';
import sinon from 'sinon';
import slackLib from '../../../server/lib/slack';
import {
  collectiveSpamCheck,
  notifyTeamAboutSuspiciousCollective,
  notifyTeamAboutPreventedCollectiveCreate,
} from '../../../server/lib/spam';
import { fakeCollective } from '../../test-helpers/fake-data';

describe('server/lib/spam', () => {
  let clock;

  before(() => {
    clock = sinon.useFakeTimers(new Date('2020-01-01'));
  });

  after(() => {
    clock.restore();
  });

  describe('collectiveSpamCheck', () => {
    it('detects bad keywords', async () => {
      // Description
      const collectiveWithBadDescription = await fakeCollective({ description: 'Some keto stuff' });
      expect(collectiveSpamCheck(collectiveWithBadDescription, 'test')).to.deep.eq({
        score: 0.3,
        keywords: ['keto'],
        domains: [],
        context: 'test',
        data: collectiveWithBadDescription.info,
        date: '2020-01-01T00:00:00.000Z',
      });

      // Long description
      expect(collectiveSpamCheck({ longDescription: 'Some PORN stuff' })).to.deep.eq({
        score: 0.2,
        keywords: ['porn'],
        domains: [],
        context: undefined,
        date: '2020-01-01T00:00:00.000Z',
        data: { longDescription: 'Some PORN stuff' },
      });

      // Website
      expect(collectiveSpamCheck({ website: 'https://maxketo.com' })).to.deep.eq({
        score: 0.3,
        keywords: ['keto'],
        domains: [],
        context: undefined,
        date: '2020-01-01T00:00:00.000Z',
        data: { website: 'https://maxketo.com' },
      });

      // Name
      expect(collectiveSpamCheck({ name: 'BEST KeTo!!!' })).to.deep.eq({
        score: 0.3,
        keywords: ['keto'],
        domains: [],
        context: undefined,
        date: '2020-01-01T00:00:00.000Z',
        data: { name: 'BEST KeTo!!!' },
      });
    });

    it('detects blacklisted websites', async () => {
      // Website
      expect(collectiveSpamCheck({ website: 'https://supplementslove.com/promotion' })).to.deep.eq({
        score: 1,
        keywords: [],
        domains: ['supplementslove.com'],
        context: undefined,
        date: '2020-01-01T00:00:00.000Z',
        data: { website: 'https://supplementslove.com/promotion' },
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
      const report = collectiveSpamCheck({ name: 'Keto stuff', slug: 'ketoooo' });
      await notifyTeamAboutSuspiciousCollective(report);
      expect(slackPostMessageStub.calledOnce).to.be.true;

      const args = slackPostMessageStub.getCall(0).args;
      expect(args[0]).to.eq(
        '*Suspicious collective data was submitted for collective:* https://opencollective.com/ketoooo\nScore: 0.3\nKeywords: `keto`',
      );
      expect(args[2].channel).to.eq('#abuse');
    });
  });

  describe('notifyTeamAboutPreventedCollectiveCreate', () => {
    let slackPostMessageStub = null;

    before(() => {
      slackPostMessageStub = sinon.stub(slackLib, 'postMessage');
    });

    after(() => {
      slackPostMessageStub.restore();
    });

    it('notifies Slack with the report info', async () => {
      const report = collectiveSpamCheck({ name: 'Keto stuff', slug: 'ketoooo' });
      await notifyTeamAboutPreventedCollectiveCreate(report);
      expect(slackPostMessageStub.calledOnce).to.be.true;

      const args = slackPostMessageStub.getCall(0).args;
      expect(args[0]).to.eq(
        'A collective creation was prevented and the user has been put in limited mode.\nKeywords: `keto`\nCollective data:\n> {"name":"Keto stuff","slug":"ketoooo"}',
      );
      expect(args[2].channel).to.eq('#abuse');
    });
  });
});
