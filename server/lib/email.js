const config = require('config');
const _ = require('lodash');
const Promise = require('bluebird');
const juice = require('juice');
const nodemailer = require('nodemailer');

const debug = require('debug')('email');
const templates = require('./loadEmailTemplates')();
const activities = require('../constants/activities');


const render = (name, data, config) => {
    data.config = config;
    data.logoNotSvg = data.group && data.group.logo && !data.group.logo.endsWith('.svg');
    return templates[name](data);
};

/*
 * Gets the body from a string (usually a template)
 */
const getBody = str => str.split('\n').slice(2).join('\n');

/*
 * Appends appropriate prefix and cleans up subject
 */
const getSubject = str => {
    var subj = '';
    if (process.env.NODE_ENV === 'staging') {
      subj += '[STAGING] ';
    } else if (process.env.NODE_ENV !== 'production'){
      subj += '[TESTING] ';
    }
    subj += str.split('\n')[0].replace(/^Subject: ?/i, '');
    return subj;
};

/*
 * sends an email message to a recipient with given subject and body
 */
const sendMessage = (recipient, subject, html) => {
  debug("email: ", recipient, subject, html);

  if (config.mailgun.user) {
    const mailgun = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: config.mailgun.user,
        pass: config.mailgun.password
      }
    });

    return new Promise((resolve, reject) => {
      mailgun.sendMail({
        from: config.email.from,
        to: recipient,
        bcc: 'ops@opencollective.com',
        subject,
        html
      }, (err, info) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(info);
        }
      })
    });
  } else {
    console.warn("Warning: No mail sent - Mailgun is not configured");
    return Promise.resolve();
  }
};

/*
 * Given a template, recipient and data, generates email.
 */

const generateEmailFromTemplate = (template, recipient, data) => {

  if (template === 'thankyou') {
    if (data.group.name.match(/WWCode/i))
      template += '.wwcode';
    if (data.group.name.match(/ispcwa/i))
      template += '.ispcwa';
    if (_.contains(['lesbarbares', 'nuitdebout', 'laprimaire'], data.group.slug)) {
      template += '.fr';

      if (data.group.slug === 'laprimaire')
        template = 'thankyou.laprimaire';

      // xdamman: hack
      switch (data.interval) {
        case 'month':
          data.interval = 'mois';
          break;
        case 'year':
          data.interval = 'an';
          break;
      }
    }
  }

  if (template === 'group.transaction.created') {
    template = (data.transaction.amount > 0) ? 'group.donation.created' : 'group.expense.created';
    if (data.user && data.user.twitterHandle) {
      const groupMention = (data.group.twitterHandle) ? `@${data.group.twitterHandle}` : data.group.name;
      const text = `Hi @${data.user.twitterHandle} thanks for your donation to ${groupMention} https://opencollective.com/${data.group.slug} 🎉😊`;
      data.tweet = {
        text,
        encoded: encodeURIComponent(text)
      };
    }
  }

  if (!templates[template]) {
    return Promise.reject(new Error("Invalid email template"));
  }
  return Promise.resolve(juice(render(template, data, config)));
};

/*
 * Given a template, recipient and data, generates email and sends it.
 * Deprecated. Should use sendMessageFromActivity() for sending new emails.
 */
const generateEmailFromTemplateAndSend = (template, recipient, data) => {

  return generateEmailFromTemplate(template, recipient, data)
    .then(templateString => sendMessage(recipient, getSubject(templateString), getBody(templateString)));
};

/*
 * Given an activity, it sends out an email to the right people and right template
 */
const sendFromActivity = (activity, notification) => {
  if (activity.type === activities.GROUP_TRANSACTION_CREATED) {
    return generateEmailFromTemplateAndSend('group.transaction.created', notification.User.email, activity.data);
  } else {
    return Promise.resolve();
  }
}

module.exports = {

  getBody,
  getSubject,
  sendMessage,
  generateEmailFromTemplate,
  send: generateEmailFromTemplateAndSend,
  sendFromActivity
};