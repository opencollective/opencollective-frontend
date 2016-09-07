import config from 'config';
import Promise from 'bluebird';
import Twitter from 'twitter';
import activityType from '../constants/activities';

export function tweetActivity(Sequelize, activity) {
  if (activity.type === activityType.GROUP_TRANSACTION_CREATED
    && activity.data.transaction.amount > 0
    // users without twitterHandle are ignored
    && activity.data.user.twitterHandle) {
      return Sequelize.models.Group.findById(activity.GroupId)
        .then(group => group.getTwitterSettings())
        .then(template => template.thankDonation.replace('$backer', `@${activity.data.user.twitterHandle}`))
        .then(status => tweetStatus(Sequelize, activity.GroupId, status));
  } else {
    return null;
  }
}

export function tweetStatus(Sequelize, GroupId, status) {
  return Sequelize.models.ConnectedAccount.findOne({
    where: {
      GroupId,
      provider: 'twitter'
    }
  })
  .tap(connectedAccount => {
    // groups without twitter credentials are ignored
    if (connectedAccount) {
      const client = new Twitter({
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token_key: connectedAccount.clientId,
        access_token_secret: connectedAccount.secret
      });

      console.log(`Tweeting for group ID ${GroupId}: ${status}`);
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
