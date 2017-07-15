import config from 'config';
import Promise from 'bluebird';
import Twitter from 'twitter';
import activityType from '../constants/activities';

export function tweetActivity(Sequelize, activity) {
  if (activity.type === activityType.GROUP_TRANSACTION_CREATED
    && activity.data.transaction.amount > 0
    // users without twitterHandle are ignored
    && activity.data.user.twitterHandle) {
      return Sequelize.models.Collective.findById(activity.CollectiveId)
        .then(collective => collective.getTwitterSettings())
        .then(template => template.thankDonation.replace('$backer', `@${activity.data.user.twitterHandle}`))
        .then(status => tweetStatus(Sequelize, activity.CollectiveId, status));
  } else {
    return null;
  }
}

export function tweetStatus(Sequelize, CollectiveId, status) {
  return Sequelize.models.ConnectedAccount.findOne({
    where: {
      CollectiveId,
      provider: 'twitter'
    }
  })
  .tap(connectedAccount => {
    // collectives without twitter credentials are ignored
    if (connectedAccount) {
      const client = new Twitter({
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token_key: connectedAccount.clientId,
        access_token_secret: connectedAccount.secret
      });

      console.log(`Tweeting for collective ID ${CollectiveId}: ${status}`);
      if (process.env.NODE_ENV === 'production') {
        const tweet = Promise.promisify(client.post, { context: client });
        return tweet("statuses/update", { status });
      } else {
        console.log('No tweet sent: must be in production');
        return null;
      }
    }
  });
}
