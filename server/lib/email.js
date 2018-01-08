import config from 'config';
import _, { isArray, pick } from 'lodash';
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

  let text, filepath;
  data.imageNotSvg = data.collective && data.collective.image && !data.collective.image.endsWith('.svg');
  data = _.merge({}, data);
  delete data.config;
  data.config = { host: config.host };

  // sets paypalEmail for purpose of email templates
  if (data.user) {
    data.user.paypalEmail = data.user.paypalEmail || data.user.email;
  }
  
  if (templates[`${template}.text`]) {
    text = templates[`${template}.text`](data);
  }
  const html = juice(templates[template](data));
  const recipient = _.get(data, 'recipient.dataValues') || data.recipient || {};
  const slug = data.collective && data.collective.slug || recipient.slug || recipient.email && recipient.email.substr(0, recipient.email.indexOf('@')) || recipient.substr && recipient.substr(0, recipient.indexOf('@'));

  // When in preview mode, we export an HTML version of the email in `/tmp/:template.:slug.html`
  if (process.env.DEBUG && process.env.DEBUG.match(/preview/)) {
    filepath = `/tmp/${template}.${slug}.html`;
    const script = `<script>data=${JSON.stringify(data)};</script>`;
    fs.writeFileSync(filepath, `${html}\n\n${script}`);
    console.log(`Preview email template: file://${filepath}`);
    if (text) {
      filepath = `/tmp/${template}.${slug}.txt`;
      fs.writeFileSync(filepath, text);
      console.log(`Preview email template: file://${filepath}`);
    }
  }

  // When in development mode, we log the data used to compile the template
  // (useful to get login token without sending an email)
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG && process.env.DEBUG.match(/email/)) {
    console.log(`Rendering ${template} with data`, data);
  }

  return {text, html};
};

const generateUnsubscribeToken = (email, collectiveSlug, type) => {
  const uid = `${email}.${collectiveSlug || 'any'}.${type}.${config.keys.opencollective.secret}`;
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

  attributes.body = lines.slice(index).join('\n').trim();
  return attributes;
};

/*
 * sends an email message to a recipient with given subject and body
 */
const sendMessage = (recipients, subject, html, options = {}) => {
  options.bcc = options.bcc || `emailbcc@opencollective.com`;

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
  } else if (process.env.NODE_ENV !== 'production') {
    subject = `[TESTING] ${subject}`;
  }

  if (process.env.ONLY) {
    debug("Only sending email to ", process.env.ONLY);
    recipients = [process.env.ONLY];
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
      if (process.env.NODE_ENV !== 'production') {
        to = `emailbcc+${to.replace(/@/g, '-at-')}@opencollective.com`;
      }
      const from = options.from || config.email.from;
      const cc = options.cc;
      const bcc = options.bcc;
      const text = options.text;
      const attachments = options.attachments;
      const headers = { 'o:tag': options.tag, 'X-Mailgun-Dkim': 'yes' };
      debug("mailgun> sending email to ", to,"bcc", bcc, "text", text);

      mailgun.sendMail({ from, cc, to, bcc, subject, text, html, headers, attachments }, (err, info) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(info);
        }
      })
    });
  } else {
    if (process.env.DEBUG && process.env.DEBUG.match(/email/)) {
      console.warn("Warning: No mail sent - Mailgun is not configured");
    }
    return Promise.resolve();
  }
};

/**
 * Get the label to unsubscribe from the email notification
 * Shown in the footer of the email following "To unsubscribe from "
 */
const getNotificationLabel = (template, recipients) => {
  
  if (!isArray(recipients)) recipients = [recipients];

  template = template.replace('.text', '');

  const notificationTypeLabels = {
    'email.approve': 'notifications of new emails pending approval',
    'email.message': `the ${recipients[0].substr(0, recipients[0].indexOf('@'))} mailing list`,
    'collective.order.created': 'notifications of new donations for this collective',
    'collective.expense.created': 'notifications of new expenses submitted to this collective',
    'collective.monthlyreport': 'monthly reports for collectives',
    'collective.member.created': 'notifications of new members',
    'host.monthlyreport': 'monthly reports for host',
    'collective.transaction.created': 'notifications of new transactions for this collective',
    'user.monthlyreport': 'monthly reports for backers',
    'user.yearlyreport': 'yearly reports'
  }

  return notificationTypeLabels[template];
};

/*
 * Given a template, recipient and data, generates email.
 */
const generateEmailFromTemplate = (template, recipient, data, options = {}) => {

  if (template === 'ticket.confirmed') {
    if (data.collective.slug === 'sustainoss')
      template += '.sustainoss';
  }

  if (template === 'donationmatched') {
    if (data.collective.slug.match(/wwcode/))
      template += '.wwcode';
  }
  if (template === 'thankyou') {
    if (data.collective.slug.match(/wwcode/))
      template += '.wwcode';
    if (data.collective.name.match(/ispcwa/i))
      template += '.ispcwa';
    if (data.collective.slug === 'kendraio')
      template = 'thankyou.kendraio';
    if (data.collective.slug === 'brusselstogether')
      template = 'thankyou.brusselstogether';
    if (data.collective.slug === 'sustainoss')
      template = 'thankyou.sustainoss';
    if (_.contains(['lesbarbares', 'nuitdebout', 'laprimaire', 'enmarchebe'], data.collective.slug)) {
      template += '.fr';

      if (data.collective.slug === 'laprimaire')
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

  if (template === 'collective.transaction.created') {
    template = (data.transaction.amount > 0) ? 'collective.order.created' : 'collective.expense.paid';
    if (data.user && data.user.twitterHandle) {
      const collectiveMention = (data.collective.twitterHandle) ? `@${data.collective.twitterHandle}` : data.collective.name;
      const text = `Hi @${data.user.twitterHandle} thanks for your donation to ${collectiveMention} https://opencollective.com/${data.collective.slug} 🎉😊`;
      data.tweet = {
        text,
        encoded: encodeURIComponent(text)
      };
    }
  }

  const slug = (data.collective && data.collective.slug) ? data.collective.slug : 'undefined';

  data.unsubscribeUrl = `${config.host.website}/api/services/email/unsubscribe/${encodeURIComponent(options.bcc || recipient)}/${slug}/${options.type || template}/${generateUnsubscribeToken(options.bcc || recipient, slug, options.type || template)}`;
  data.notificationTypeLabel = getNotificationLabel(template, recipient);
  data.config = pick(config, ['host']);
  data.utm = `utm_source=opencollective&utm_campaign=${template}&utm_medium=email`;

  if (!templates[template]) {
    return Promise.reject(new Error(`Invalid email template: ${template}`));
  }
  return Promise.resolve(render(template, data));
};

/*
 * Given a template, recipient and data, generates email and sends it.
 * Deprecated. Should use sendMessageFromActivity() for sending new emails.
 */
const generateEmailFromTemplateAndSend = (template, recipient, data, options = {}) => {
  if (!recipient) {
    return Promise.reject("No recipient");
  }
  return generateEmailFromTemplate(template, recipient, data, options)
    .then(renderedTemplate => {
      const attributes = getTemplateAttributes(renderedTemplate.html);
      options.text = renderedTemplate.text;
      options.tag = template;
      return emailLib.sendMessage(recipient, attributes.subject, attributes.body, options)
    });
};

/*
 * Given an activity, it sends out an email to the right people and right template
 */
const sendMessageFromActivity = (activity, notification) => {
  const data = activity.data;
  const userEmail = notification && notification.User ? notification.User.email : activity.data.user.email;

  switch (activity.type) {
    case activities.COLLECTIVE_TRANSACTION_CREATED:
      return generateEmailFromTemplateAndSend('collective.transaction.created', userEmail, data);

    case activities.COLLECTIVE_MEMBER_CREATED:
      return generateEmailFromTemplateAndSend('collective.member.created', userEmail, data);

    case activities.COLLECTIVE_EXPENSE_CREATED:
      data.actions = {
        approve: notification.User.generateLoginLink(`/${data.collective.slug}/expenses/${data.expense.id}/approve`),
        reject: notification.User.generateLoginLink(`/${data.collective.slug}/expenses/${data.expense.id}/reject`)
      };
      return generateEmailFromTemplateAndSend('collective.expense.created', userEmail, data);

    case activities.COLLECTIVE_EXPENSE_APPROVED:
      data.actions = {
        viewExpenseUrl: notification.User.generateLoginLink(`/${data.collective.slug}/transactions/expenses#exp${data.expense.id}`)
      }
      return generateEmailFromTemplateAndSend('collective.expense.approved.for.host', userEmail, data);

    case activities.COLLECTIVE_CREATED:
      data.actions = {
        approve: notification.User.generateLoginLink(`/${data.host.slug}/collectives/${data.collective.id}/approve`),
      };
      return generateEmailFromTemplateAndSend('collective.created', userEmail, data);

    case activities.SUBSCRIPTION_CANCELED:
      return generateEmailFromTemplateAndSend('subscription.canceled', userEmail, data, { cc: `info@${data.collective.slug}.opencollective.com` });

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
