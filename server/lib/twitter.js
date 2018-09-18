import config from 'config';
import Promise from 'bluebird';
import Twitter from 'twitter';
import activityType from '../constants/activities';
import models from '../models';
import { get } from 'lodash';
import debugLib from 'debug';
const debug = debugLib('twitter');
import { formatCurrency } from '../lib/utils';
import IntlMessageFormat from 'intl-messageformat';

const tweetUpdate = async activity => {
  const tweet = twitterLib.compileTweet('updatePublished', {
    title: activity.data.update.title,
  });
  const twitterAccount = await models.ConnectedAccount.findOne({
    where: { CollectiveId: activity.CollectiveId, service: 'twitter' },
  });
  if (!twitterAccount) {
    debug('no twitter account associated to ', activity.CollectiveId);
    return;
  }
  twitterAccount.settings = twitterAccount.settings || {};
  const settings = twitterAccount.settings['updatePublished'] || {};
  if (!settings.active) {
    debug('updatePublished.active false', settings);
    return;
  }

  twitterLib.tweetStatus(twitterAccount, tweet, activity.data.url);
};

const tweetNewMember = async activity => {
  if (get(activity, 'data.member.role') !== 'BACKER') {
    debug('skipping', activity.type, get(activity, 'data.member.role'));
    return;
  }

  if (!get(activity, 'data.member.memberCollective.twitterHandle')) {
    debug(
      'skipping',
      'no twitter handle for ',
      get(activity, 'data.member.memberCollective.slug'),
    );
    return;
  }

  const twitterAccount = await models.ConnectedAccount.findOne({
    where: { CollectiveId: activity.CollectiveId, service: 'twitter' },
  });
  if (!twitterAccount) {
    debug('no twitter account associated to ', activity.CollectiveId);
    return;
  }
  debug(twitterAccount.settings);
  twitterAccount.settings = twitterAccount.settings || {};
  const settings = twitterAccount.settings['newBacker'] || {};
  if (!settings.active) {
    debug('newBacker.active false', settings);
    return;
  }

  const template = settings.tweet;

  // todo: we should use the handlebar templating system to support {{#if}}{{/if}}
  const status = template
    .replace(
      '{backerTwitterHandle}',
      `@${get(activity, 'data.member.memberCollective.twitterHandle')}`,
    )
    .replace(
      '{referralTwitterHandle}',
      `@${get(activity, 'data.order.referral.twitterHandle')}`,
    )
    .replace(
      '{amount}',
      formatCurrency(
        get(activity, 'data.order.totalAmount'),
        get(activity, 'data.order.currency'),
      ),
    );

  return await twitterLib.tweetStatus(
    twitterAccount,
    status,
    `https://opencollective.com/${get(activity, 'data.collective.slug')}`,
  );
};

const tweetActivity = async activity => {
  debug('>>> tweetActivity', activity.type);
  debug('>>> tweetActivity.data', JSON.stringify(activity.data));
  switch (activity.type) {
    case activityType.COLLECTIVE_MEMBER_CREATED:
      return tweetNewMember(activity);

    case activityType.COLLECTIVE_UPDATE_PUBLISHED:
      return tweetUpdate(activity);
  }
};

const tweetStatus = (twitterAccount, status, url, options = {}) => {
  // collectives without twitter credentials are ignored
  if (!twitterAccount) {
    debug('>>> tweetStatus: no twitter account connected');
    return;
  }

  const client = new Twitter({
    consumer_key: config.twitter.consumerKey,
    consumer_secret: config.twitter.consumerSecret,
    access_token_key: twitterAccount.clientId,
    access_token_secret: twitterAccount.token,
  });

  if (url) {
    status += `\n${url}`;
  }

  debug('tweeting status: ', status, 'with options:', options);
  if (config.twitter.consumerSecret) {
    const tweet = Promise.promisify(client.post, { context: client });
    return tweet('statuses/update', { status, ...options });
  } else {
    console.log('Tweet not sent: no twitter key/secret provided in env');
    return Promise.resolve();
  }
};

const compileTweet = (template, data, message) => {
  const messages = {
    'en-US': {
      tenBackers: `🎉 {collective} just reached 10 backers! Thank you {topBackersTwitterHandles} 🙌
Support them too!`,
      oneHundred: `🎉 {collective} just reached 100 backers!! 🙌
Support them too!`,
      oneThousandBackers: `🎉 {collective} just reached 1,0000 backers!!! 🙌
Support them too!`,
      updatePublished: 'Latest update from the collective: {title}',
      monthlyStats: `In {month}, {totalNewBackers, select, 
  0 {no new backer joined. 😑} 
  1 {one new backer joined.} 
  other {{totalNewBackers} {totalNewBackers, plural, one {backer} other {backers}} joined ({newBackersTwitterHandles}) - you are the best! 🙌 }
}

We received {totalAmountReceived} from {totalActiveBackers} {totalActiveBackers, plural, one {backer} other {backers}} and we spent {topExpenseCategories, select,
  none {{totalAmountSpent}}
  other {{totalAmountSpent} on {topExpenseCategories}}
}. Our current balance is {balance}.

Top backers: {topBackersTwitterHandles}`,
      monthlyStatsNoNewDonation: `In {month}, we haven't received any new donation. 😑
    
Our current balance is {balance}.

Become a backer! 😃`,
    },
  };

  if (message) {
    messages['en-US'][template] = message;
  }

  if (!messages['en-US'][template]) {
    console.error('Invalid tweet template', template);
    return;
  }

  const thankyou = '\n\nThank you! 🙏';

  const compiled = new IntlMessageFormat(messages['en-US'][template], 'en-US');
  let tweet = compiled.format(data);

  if (template === 'monthlyStats') {
    // A URL always takes 23 chars (+ space)
    if (tweet.length < 280 - 24 - thankyou.length) {
      tweet += thankyou;
    }
  }
  return tweet;
};

const twitterLib = {
  tweetActivity,
  tweetStatus,
  compileTweet,
};

export default twitterLib;
