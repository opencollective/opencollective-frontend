import config from 'config';
import _ from 'lodash';
import Promise from 'bluebird';
import juice from 'juice';
import nodemailer from 'nodemailer';
import debugLib from 'debug';
import templates from './emailTemplates';
import activities from '../constants/activities';
import {isEmailInternal} from './utils';
import crypto from 'crypto';

const debug = debugLib('email');

const render = (template, data) => {
    data.logoNotSvg = data.group && data.group.logo && !data.group.logo.endsWith('.svg');
    data = _.merge({}, data);
    delete data.config;
    data.config = { host: config.host };
    debug(`Preview email template: http://localhost:3060/templates/email/${template}?data=${encodeURIComponent(JSON.stringify(data))}`);
    return juice(templates[template](data));
};

const generateUnsubscribeToken = (email, groupSlug, type) => {
  const uid = `${email}.${groupSlug}.${type}.${config.keys.opencollective.secret}`;
  const token = crypto.createHash('md5').update(uid).digest("hex");
  return token;
}

/*
 * Gets the body from a string (usually a template)
 */
const getBody = str => str.split('\n').slice(2).join('\n');

/*
 * Appends appropriate prefix and cleans up subject
 */
const getSubject = str => {
    let subj = '';
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
const sendMessage = (recipients, subject, html, options) => {
  options = options || {};
  debug("email: ", recipients, subject);

  if (!_.isArray(recipients)) recipients = [ recipients ];

  recipients = recipients.filter(recipient => {
    if (!recipient.match(/.+@.+\..+/)) {
      debug(`${recipient} is an invalid email address, skipping`);
      return false;
    }
    // if not in production, only send out emails to bcc'd opencollective address
    if (process.env.NODE_ENV !== 'production' && !isEmailInternal(recipient)) {
      debug(`${recipient} is an external email address, skipping in development environment`);
      return false;
    } else {
      return true;
    }
  });

  debug(`sending email to ${recipients.join(', ')}`);
  if (recipients.length === 0) {
    debug("No recipient to send to, only sending to ops");
  }

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
        from: options.from || config.email.from,
        to: recipients.join(', '),
        bcc: `ops@opencollective.com,${options.bcc}`,
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

const getNotificationLabel = (template, recipient) => {

  const notificationTypeLabels = {
    'group.monthlyreport': 'monthly reports',
    'group.transaction.created': 'notifications of new transactions for this collective',
    'email.approve': 'notifications of new emails pending approval',
    'email.message': recipient
  }

  return notificationTypeLabels[template];

};

/*
 * Given a template, recipient and data, generates email.
 */

const generateEmailFromTemplate = (template, recipient, data, options) => {

  options = options || {};

  if (template === 'thankyou') {
    if (data.group.name.match(/WWCode/i))
      template += '.wwcode';
    if (data.group.name.match(/ispcwa/i))
      template += '.ispcwa';
    if (data.group.slug === 'brusselstogether')
      template = 'thankyou.brusselstogether';
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

  const slug = (data.group && data.group.slug) ? data.group.slug : 'undefined';

  data.unsubscribeUrl = `${config.host.website}/api/services/email/unsubscribe/${encodeURIComponent(options.bcc || recipient)}/${slug}/${options.type || template}/${generateUnsubscribeToken(options.bcc || recipient, slug, options.type || template)}`;
  data.notificationTypeLabel = getNotificationLabel(template, recipient);
  data.config = config;

  if (!templates[template]) {
    return Promise.reject(new Error("Invalid email template"));
  }
  return Promise.resolve(render(template, data));
};

/*
 * Given a template, recipient and data, generates email and sends it.
 * Deprecated. Should use sendMessageFromActivity() for sending new emails.
 */
const generateEmailFromTemplateAndSend = (template, recipient, data, options) => {
  return generateEmailFromTemplate(template, recipient, data, options)
    .then(templateString => emailLib.sendMessage(recipient, getSubject(templateString), getBody(templateString), options));
};

/*
 * Given an activity, it sends out an email to the right people and right template
 */
const sendMessageFromActivity = (activity, notification) => {
  if (activity.type === activities.GROUP_TRANSACTION_CREATED) {
    return generateEmailFromTemplateAndSend('group.transaction.created', notification.User.email, activity.data);
  } else {
    return Promise.resolve();
  }
}

const emailLib = {
  render,
  getBody,
  getSubject,
  sendMessage,
  generateEmailFromTemplate,
  send: generateEmailFromTemplateAndSend,
  sendMessageFromActivity
};

export default emailLib;
