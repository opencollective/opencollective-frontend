import config from 'config';
import Promise from 'bluebird';
import Twitter from 'twitter';
import activityType from '../constants/activities';
import models from '../models';
import { get } from 'lodash';
import debugLib from 'debug';
const debug = debugLib("twitter");
import { formatCurrency } from '../lib/utils';

const tweetActivity = async (activity) => {
  debug(">>> tweetActivity", activity);
  debug(">>> tweetActivity.data", JSON.stringify(activity.data));
  if (activity.type !== activityType.COLLECTIVE_MEMBER_CREATED || get(activity, 'data.member.role') !== 'BACKER') {
    debug("skipping", activity.type, get(activity, 'data.member.role'));
    return;
  }

  if (!get(activity, 'data.member.memberCollective.twitterHandle')) {
    debug("skipping", "no twitter handle for ", get(activity, 'data.member.memberCollective.slug'));
    return;
  }

  const twitterAccount = await models.ConnectedAccount.findOne({ where: { CollectiveId: activity.CollectiveId, service: 'twitter' }});
  if (!twitterAccount) {
    debug("no twitter account associated to ", activity.CollectiveId);
    return;
  }
  debug(twitterAccount.settings);
  twitterAccount.settings = twitterAccount.settings || {};
  const settings = twitterAccount.settings['backer.created'] || {};
  if (!settings.active) {
    debug("backer.created.active false", settings);
    return;
  }

  const template = settings.tweet;

  // todo: we should use the handlebar templating system to support {{#if}}{{/if}}
  const status = template
    .replace('{backerTwitterHandle}', `@${get(activity, 'data.member.memberCollective.twitterHandle')}`)
    .replace('{referralTwitterHandle}', `@${get(activity, 'data.order.referral.twitterHandle')}`)
    .replace('{amount}', formatCurrency(get(activity, 'data.order.totalAmount'), get(activity, 'data.order.currency')));

  twitterLib.tweetStatus(twitterAccount, status);
}

export const tweetStatus = (twitterAccount, status) => {
  // collectives without twitter credentials are ignored
  if (!twitterAccount) {
    debug(">>> tweetStatus: no twitter account connected");
    return;
  }

  const client = new Twitter({
    consumer_key: config.twitter.consumerKey,
    consumer_secret: config.twitter.consumerSecret,
    access_token_key: twitterAccount.clientId,
    access_token_secret: twitterAccount.token
  });

  debug("tweeting status: ", status);
  if (process.env.NODE_ENV === 'production') {
    const tweet = Promise.promisify(client.post, { context: client });
    return tweet("statuses/update", { status });
  } else {
    console.log('No tweet sent: must be in production');
    return null;
  }
}

const twitterLib = {
  tweetActivity,
  tweetStatus
};

export default twitterLib;
