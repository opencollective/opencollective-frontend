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
import fs from 'fs';

const debug = debugLib('email');

const render = (template, data) => {
    data.logoNotSvg = data.group && data.group.logo && !data.group.logo.endsWith('.svg');
    data = _.merge({}, data);
    delete data.config;
    data.config = { host: config.host };
    const html = juice(templates[template](data));

    // When in preview mode, we export an HTML version of the email in `/tmp/:template.:slug.html`
    if (process.env.DEBUG && process.env.DEBUG.match(/preview/)) {
      const slug = data.group && data.group.slug || data.recipient && data.recipient.username;
      const filepath = `/tmp/${template}.${slug}.html`;
      const script = `<script>data=${JSON.stringify(data)};</script>`;
      fs.writeFileSync(filepath, `${html}\n\n${script}`);
      console.log(`Preview email template: file://${filepath}`);
    }
    return html;
};

const generateUnsubscribeToken = (email, groupSlug, type) => {
  const uid = `${email}.${groupSlug}.${type}.${config.keys.opencollective.secret}`;
  const token = crypto.createHash('md5').update(uid).digest("hex");
  return token;
}

/*
 * Gets the body from a string (usually a template)
 */
const getTemplateAttributes = (str) => {
  let index = 0;
  const lines = str.split('\n');
  const attributes = {};
  let tokens;
  do {
    tokens = lines[index++].match(/^([a-z]+):(.+)/i);
    if (tokens) {
      attributes[tokens[1].toLowerCase()] = tokens[2].replace(/<br( \/)?>/g,'\n').trim();
    }
  } while (tokens);

  console.log("attributes", attributes);

  attributes.body = lines.slice(index).join('\n').trim();
  return attributes;
};

/*
 * sends an email message to a recipient with given subject and body
 */
const sendMessage = (recipients, subject, html, options = {}) => {
  options.bcc = options.bcc || `ops@opencollective.com`;

  if (!_.isArray(recipients)) recipients = [ recipients ];

  recipients = recipients.filter(recipient => {
    if (!recipient || !recipient.match(/.+@.+\..+/)) {
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

  if (process.env.NODE_ENV === 'staging') {
    subject = `[STAGING] ${subject}`;
  } else if (process.env.NODE_ENV !== 'production'){
    subject = `[TESTING] ${subject}`;
  }

  debug(`sending email to ${recipients.join(', ')}`);
  if (recipients.length === 0) {
    debug("No recipient to send to, only sending to bcc", options.bcc);
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
      let to;
      if (recipients.length > 0) {
        to = recipients.join(', ');
      }
      const from = options.from || config.email.from;
      const bcc = options.bcc;
      const text = options.text;
      debug("mailgun> sending email to ", to,"bcc", bcc, "text", text);
      mailgun.sendMail({ from, to, bcc, subject, text, html }, (err, info) => {
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
const generateEmailFromTemplate = (template, recipient, data, options = {}) => {

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
  data.utm = `utm_source=opencollective&utm_campaign=${template}&utm_medium=email`;

  if (!templates[template]) {
    return Promise.reject(new Error("Invalid email template"));
  }
  return Promise.resolve(render(template, data));
};

/*
 * Given a template, recipient and data, generates email and sends it.
 * Deprecated. Should use sendMessageFromActivity() for sending new emails.
 */
const generateEmailFromTemplateAndSend = (template, recipient, data, options = {}) => {
  return generateEmailFromTemplate(template, recipient, data, options)
    .then(templateString => {
      const attributes = getTemplateAttributes(templateString);
      options.text = attributes.text;
      return emailLib.sendMessage(recipient, attributes.subject, attributes.body, options)
    });
};

/*
 * Given an activity, it sends out an email to the right people and right template
 */
const sendMessageFromActivity = (activity, notification) => {
  switch (activity.type) {
    case activities.GROUP_TRANSACTION_CREATED:
      return generateEmailFromTemplateAndSend('group.transaction.created', notification.User.email, activity.data);
    case activities.GROUP_EXPENSE_CREATED:
      return generateEmailFromTemplateAndSend('group.expense.created', notification.User.email, activity.data);
    default:
      return Promise.resolve();
  }
}

const emailLib = {
  render,
  getTemplateAttributes,
  sendMessage,
  generateEmailFromTemplate,
  send: generateEmailFromTemplateAndSend,
  sendMessageFromActivity
};

export default emailLib;
