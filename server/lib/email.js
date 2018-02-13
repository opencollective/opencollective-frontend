import config from 'config';
import _, { isArray, pick, get } from 'lodash';
import Promise from 'bluebird';
import juice from 'juice';
import nodemailer from 'nodemailer';
import debugLib from 'debug';
import templates from './emailTemplates';
import { isEmailInternal } from './utils';
import crypto from 'crypto';
import fs from 'fs';
import he from 'he';
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
  const html = juice(he.decode(templates[template](data)));
  const recipient = get(data, 'recipient.dataValues') || data.recipient || {};
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
  debug(`Rendering ${template} with data`, data);

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

  if (!isArray(recipients)) recipients = [ recipients ];

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

  let to;
  if (recipients.length > 0) {
    to = recipients.join(', ');
  }
  if (process.env.ONLY) {
    debug("Only sending email to ", process.env.ONLY);
    to = process.env.ONLY;
  } else if (process.env.NODE_ENV !== 'production') {
    if (!to) {
      return Promise.reject(new Error("No recipient defined"));
  }
    to = `emailbcc+${to.replace(/@/g, '-at-')}@opencollective.com`;
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
      const from = options.from || config.email.from;
      const cc = options.cc;
      const bcc = options.bcc;
      const text = options.text;
      const attachments = options.attachments;
      const headers = { 'o:tag': options.tag, 'X-Mailgun-Dkim': 'yes' };
      debug("mailgun> sending email to ", to, "bcc", bcc, "text", text);

      mailgun.sendMail({ from, cc, to, bcc, subject, text, html, headers, attachments }, (err, info) => {
        if (err) {
          debug(">>> mailgun.sendMail error", err);
          return reject(err);
        } else {
          debug(">>> mailgun.sendMail success", info);
          return resolve(info);
        }
      })
    });
  } else {
    console.warn("Warning: No email sent - Mailgun is not configured");
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
    'collective.expense.approved.for.host': 'notifications of new expenses approved under this host',
    'collective.expense.paid.for.host': 'notifications of new expenses paid under this host',
    'collective.monthlyreport': 'monthly reports for collectives',
    'collective.member.created': 'notifications of new members',
    'collective.update.published': 'notifications of new updates from this collective',
    'host.monthlyreport': 'monthly reports for host',
    'host.yearlyreport': 'yearly reports for host',
    'collective.transaction.created': 'notifications of new transactions for this collective',
    'onboarding': 'onboarding emails',
    'user.monthlyreport': 'monthly reports for backers',
    'user.yearlyreport': 'yearly reports'
  }

  return notificationTypeLabels[template];
};

/*
 * Given a template, recipient and data, generates email.
 */
const generateEmailFromTemplate = (template, recipient, data = {}, options = {}) => {

  const slug = get(data, 'collective.slug') || 'undefined';

  // If we are sending the same email to multiple recipients, it doesn't make sense to allow them to unsubscribe
  if (!isArray(recipient)) {
    data.notificationTypeLabel = getNotificationLabel(options.type || template, recipient);
    data.unsubscribeUrl = `${config.host.website}/api/services/email/unsubscribe/${encodeURIComponent(options.bcc || recipient)}/${slug}/${options.type || template}/${generateUnsubscribeToken(options.bcc || recipient, slug, options.type || template)}`;
  }

  if (template === 'ticket.confirmed') {
    if (slug === 'sustainoss')
      template += '.sustainoss';
  }
  if (template.match(/^host\.(monthly|yearly)report$/)) {
    template = 'host.report';
  }
  if (template === 'donationmatched') {
    if (slug.match(/wwcode/))
      template += '.wwcode';
  }
  if (template === 'thankyou') {
    if (slug.match(/wwcode/))
      template += '.wwcode';

    if (_.contains(['chsf', 'kendraio', 'brusselstogether', 'sustainoss', 'ispcwa'], slug)) {
      template = `thankyou.${slug}`;
    }

    if (_.contains(['laprimaire', 'lesbarbares', 'nuitdebout', 'enmarchebe'], slug)) {
      template += '.fr';

      if (slug === 'laprimaire') {
        template = 'thankyou.laprimaire';
      }

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

  if (template === 'collective.member.created') {
    if (get(data, 'member.memberCollective.twitterHandle') && get(data, 'member.role') === 'BACKER') {
      const collectiveMention = (get(data, 'collective.twitterHandle')) ? `@${data.collective.twitterHandle}` : data.collective.name;
      const text = `Hi @${data.member.memberCollective.twitterHandle} thanks for your donation to ${collectiveMention} https://opencollective.com/${slug} 🎉😊`;
      data.tweet = {
        text,
        encoded: encodeURIComponent(text)
      };
    }
  }

  data.config = pick(config, ['host']);
  data.utm = `utm_source=opencollective&utm_campaign=${template}&utm_medium=email`;

  if (!templates[template]) {
    return Promise.reject(new Error(`Invalid email template: ${template}`));
  }
  return Promise.resolve(render(template, data));
};

/*
 * Given a template, recipient and data, generates email and sends it.
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

const emailLib = {
  render,
  getTemplateAttributes,
  sendMessage,
  generateEmailFromTemplate,
  send: generateEmailFromTemplateAndSend
};

export default emailLib;
