const config = require('config');
const Promise = require('bluebird');
const Twitter = require('twitter');
const activityType = require('../constants/activities');

function tweetActivity(Sequelize, activity) {
  if (activity.type === activityType.GROUP_TRANSACTION_CREATED
    && activity.data.transaction.amount > 0
    // users without twitterHandle are ignored
    && activity.data.user.twitterHandle) {
      return getTemplate(Sequelize, activity.GroupId, activity.type)
        .then(template => template.replace('#1', activity.data.user.twitterHandle))
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

function getTemplate(Sequelize, GroupId, templateType, singular) {
  return Sequelize.models.Group.findById(GroupId)
    .then(group => {
      const twitterTemplates = group.settings.twitterTemplates;
      const template = twitterTemplates && twitterTemplates[templateType];
      if (singular && template && template.singular) {
        return template.singular;
      } else if (!singular && template && template.plural) {
        return template.plural;
      }
      return template;
    })
    .then(groupTemplate => groupTemplate || getDefaultTemplate(templateType, singular));
}

function getDefaultTemplate(templateType, singular) {
  switch (templateType) {
    case activityType.GROUP_TRANSACTION_CREATED:
      return `#1 thanks for backing us!`;

    case activityType.GROUP_MONTHLY:
      if (singular) {
        return `Thank you #2for supporting our collective`;
      } else {
        return `Thanks to our #1 backers and sponsors #2for supporting our collective`;
      }
  }
}

module.exports = {
  tweetActivity,
  tweetStatus,
  getTemplate
};
