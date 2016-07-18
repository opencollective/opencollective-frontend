const config = require('config');
const Promise = require('bluebird');
const Twitter = require('twitter');
const activityType = require('../constants/activities');

function tweetActivity(Sequelize, activity) {
  if (activity.type === activityType.GROUP_TRANSACTION_CREATED
    && activity.data.transaction.amount > 0
    // users without twitterHandle are ignored
    && activity.data.user.twitterHandle) {
      return Sequelize.models.Group.findById(activity.GroupId)
        .then(group => group.getTwitterSettings().thankDonation)
        .then(template => template.replace('$backer', activity.data.user.twitterHandle))
        .then(status => tweetStatus(Sequelize, activity.GroupId, status));
  } else {
    return Promise.resolve();
  }
}

function tweetStatus(Sequelize, GroupId, status) {
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

      const tweet = Promise.promisify(client.post, { context: client });
      console.log(`Tweeting for group ID ${GroupId}: ${status}`);
      return tweet("statuses/update", { status });
    }
  });
}

module.exports = {
  tweetActivity,
  tweetStatus
};
