#!/usr/bin/env node
import '../../server/env';

process.env.PORT = 3066;

import config from 'config';
import Promise from 'bluebird';
import debugLib from 'debug';
import models, { sequelize, Op } from '../../server/models';
import twitter from '../../server/lib/twitter';
import slackLib from '../../server/lib/slack';
import { pluralize } from '../../server/lib/utils';
import _, { pick, get, set } from 'lodash';
import { types as collectiveTypes } from '../../server/constants/collectives';

const TenMinutesAgo = new Date();
TenMinutesAgo.setMinutes(TenMinutesAgo.getMinutes() - 10);

if (process.env.NODE_ENV !== 'production') {
  TenMinutesAgo.setDate(TenMinutesAgo.getDate() - 40);
}

const debug = debugLib('milestones');
const startTime = new Date();

const init = () => {
  models.Member.findAll({
    attributes: [[sequelize.fn('COUNT', sequelize.col('Member.id')), 'count'], 'CollectiveId'],
    where: {
      createdAt: { [Op.gte]: TenMinutesAgo },
      role: 'BACKER',
    },
    limit: 30,
    group: ['CollectiveId', 'collective.id'],
    include: [{ model: models.Collective, where: { type: { [Op.ne]: collectiveTypes.EVENT } }, as: 'collective' }],
  })
    .tap(transactionsGroups => {
      console.log(`${transactionsGroups.length} different collectives got new backers since ${TenMinutesAgo}`);
    })
    .map(processNewMembersCount)
    .then(() => {
      const timeLapsed = new Date() - startTime;
      console.log(`Total run time: ${timeLapsed}ms`);
      process.exit(0);
    });
};

const notifyCollective = async (CollectiveId, milestone, collective) => {
  const twitterAccount = await models.ConnectedAccount.findOne({
    where: { service: 'twitter', CollectiveId },
  });
  const slackAccount = await models.Notification.findOne({
    where: { channel: 'slack', CollectiveId },
  });

  const tweet = await compileTweet(collective, milestone, twitterAccount);

  if (!twitterAccount) {
    debug(`${collective.slug}: the collective id ${CollectiveId} doesn't have a twitter account connected, skipping`);
    await postToSlack(tweet, slackAccount);
    return;
  }
  if (!get(twitterAccount, `settings.${milestone}.active`)) {
    debug(
      `${collective.slug}: the collective id ${CollectiveId} hasn't activated the ${milestone} milestone notification, skipping`,
    );
    await postToSlack(tweet, slackAccount);
    return;
  }
  if (process.env.TWITTER_CONSUMER_SECRET) {
    const res = await sendTweet(tweet, twitterAccount, milestone);
    return await postToSlack(res.url, slackAccount);
  }
};

/**
 * Process a milestone and send a notification to
 * - slack.opencollective.com
 * - slack of the host (if any)
 * - slack of the collective (if any)
 * @param {*} milestone
 * @param {*} collective
 */
const processMilestone = async (milestone, collective) => {
  set(collective, `data.milestones.${milestone}`, startTime);
  collective.save();
  const HostCollectiveId = await collective.getHostCollectiveId();
  return Promise.all([
    notifyCollective(HostCollectiveId, milestone, collective),
    notifyCollective(collective.id, milestone, collective),
  ]);
};

const processNewMembersCount = async newMembersCount => {
  const {
    collective,
    dataValues: { count },
  } = newMembersCount;
  const backersCount = await collective.getBackersCount();
  if (backersCount < 10) {
    debug(`${collective.slug} only has ${backersCount} ${pluralize('backer', backersCount)}, skipping`);
    return;
  }

  // If the collective just passed the number of x backers (could be that they reached > x within the last time span)
  const hasPassedMilestone = numberOfBackers =>
    backersCount - count < numberOfBackers && backersCount >= numberOfBackers;

  if (hasPassedMilestone(1000)) {
    console.log(`🎉 ${collective.slug} just passed the 1,000 backers milestone with ${backersCount} backers`);
    return await processMilestone('oneThousandBackers', collective);
  }
  if (hasPassedMilestone(100)) {
    console.log(`🎉 ${collective.slug} just passed the 100 backers milestone with ${backersCount} backers`);
    return await processMilestone('oneHundredBackers', collective);
  }
  if (hasPassedMilestone(50)) {
    console.log(`🎉 ${collective.slug} just passed the 50 backers milestone with ${backersCount} backers`);
    return await processMilestone('fiftyBackers', collective);
  }
  if (hasPassedMilestone(10)) {
    console.log(
      `🎉 ${collective.slug} got ${count} new ${pluralize(
        'backer',
        count,
      )} and just passed the 10 backers milestone with ${backersCount} backers`,
    );
    return await processMilestone('tenBackers', collective);
  }

  debug(
    `${collective.slug} got ${count} new ${pluralize(
      'backer',
      count,
    )} for a total of ${backersCount} backers, skipping`,
  );
};

const compileTwitterHandles = (userCollectives, total, limit) => {
  const twitterHandles = userCollectives.map(backer => backer.twitterHandle).filter(handle => Boolean(handle));
  const limitToShow = Math.min(twitterHandles.length, limit);
  let res = _.uniq(twitterHandles)
    .map(handle => `@${handle}`)
    .slice(0, limitToShow)
    .join(', ');
  if (limitToShow < total) {
    res += `, +${total - limitToShow}`;
  }
  return res;
};

const compileTweet = async (collective, template, twitterAccount) => {
  const replacements = {
    collective: collective.twitterHandle ? `@${collective.twitterHandle}` : collective.name,
  };

  if (template === 'tenBackers') {
    const topBackers = await collective.getTopBackers(null, null, 10);
    const backers = topBackers.map(b => pick(b.dataValues, ['twitterHandle']));
    replacements.topBackersTwitterHandles = compileTwitterHandles(backers, 10, 10);
  }

  let tweet = twitter.compileTweet(template, replacements, get(twitterAccount, `settings.${template}.tweet`));
  const path = await collective.getUrlPath();
  tweet += `\nhttps://opencollective.com/${path}`;
  return tweet;
};

const postSlackMessage = async (message, webhookUrl, options = {}) => {
  if (!webhookUrl) {
    return console.warn(`slack> no webhookUrl to post ${message}`);
  }
  try {
    console.log(`slack> posting ${message} to ${webhookUrl}`);
    return await slackLib.postMessage(message, webhookUrl, options);
  } catch (e) {
    console.warn('Unable to post to slack', e);
  }
};

const postToSlack = async (message, slackAccount) => {
  // post to slack.opencollective.com (bug: we send it twice if both `collective` and `host` have set up a Slack webhook)
  await postSlackMessage(message, config.slack.webhookUrl, {
    channel: config.slack.publicActivityChannel,
    linkTwitterMentions: true,
  });

  if (!slackAccount) {
    return console.warn(`No slack account to post ${message}`);
  }

  await postSlackMessage(message, slackAccount.webhookUrl, {
    linkTwitterMentions: true,
  });
};

const sendTweet = async (tweet, twitterAccount, template) => {
  console.log('>>> sending tweet:', tweet.length, tweet);
  if (process.env.NODE_ENV === 'production') {
    try {
      // We thread the tweet with the previous milestone
      const in_reply_to_status_id = get(twitterAccount, 'settings.milestones.lastTweetId');
      const res = await twitter.tweetStatus(twitterAccount, tweet, null, {
        in_reply_to_status_id,
      });

      set(twitterAccount, 'settings.milestones.tweetId', res.id_str);
      set(twitterAccount, 'settings.milestones.tweetSentAt', new Date(res.created_at));
      set(twitterAccount, `settings.${template}.tweetId`, res.id_str);
      set(twitterAccount, `settings.${template}.tweetSentAt`, new Date(res.created_at));
      await twitterAccount.save();
      if (process.env.DEBUG) {
        console.log('>>> twitter response: ', JSON.stringify(res));
      }
      res.url = `https://twitter.com/${res.user.screen_name}/status/${res.id_str}`;
      return res;
    } catch (e) {
      console.error('Unable to tweet', tweet, e);
    }
  }
};

init();
