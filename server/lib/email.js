const fs = require('fs');
const handlebars = require('handlebars');
const config = require('config');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const nodemailer = require('nodemailer');

const debug = require('debug')('email');
const currencies = require('../constants/currencies');


/*
* Loads templates
*/
const loadTemplates = () => {
  var templates = {};

  const templateNames = [
    'github.signup',
    'group.expense.created',
    'group.donation.created',
    'group.monthlyreport',
    'thankyou',
    'thankyou.wwcode',
    'thankyou.ispcwa',
    'thankyou.fr',
    'thankyou.laprimaire',
    'user.forgot.password',
    'user.new.token'
  ];

  const templatesPath = `${__dirname}/../../templates`;

  // Register partials
  const header = fs.readFileSync(`${templatesPath}/partials/header.hbs`, 'utf8');
  const footer = fs.readFileSync(`${templatesPath}/partials/footer.hbs`, 'utf8');
  const subscriptions = fs.readFileSync(`${templatesPath}/partials/subscriptions.hbs`, 'utf8');

  handlebars.registerPartial('header', header);
  handlebars.registerPartial('footer', footer);
  handlebars.registerPartial('subscriptions', subscriptions);

  handlebars.registerHelper('sign', (value) => {
    if (value >= 0) return '+';
    else return '';
  });

  handlebars.registerHelper('toLowerCase', (str) => {
    return str.toLowerCase();
  });

  handlebars.registerHelper('moment', (value, props) => {
    if (props && props.hash.format)
      return moment(value).format(props.hash.format);
    else
      return moment(value).format('MMMM Do YYYY');
  });

  handlebars.registerHelper('currency', (value, props) => {
    const currency = props.hash.currency;
    value = value/100; // converting cents
    if (currencies[currency]) {
      return currencies[currency](value);
    }
    console.error(`Unexpected currency ${currency}`);
    return `${value} ${currency}`;
  });

  handlebars.registerHelper('encodeURIComponent', (str) => {
    return encodeURIComponent(str);
  });

  templateNames.forEach((template) => {
    const source = fs.readFileSync(`${templatesPath}/emails/${template}.hbs`, 'utf8');
    templates[template] = handlebars.compile(source);
  });

  return templates;
};

/*
 * renders the email
 */
const render = (templates, name, data, config) => {
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

    return Promise.promisify(
      mailgun.sendMail({
        from: config.email.from,
        to: recipient,
        bcc: 'ops@opencollective.com',
        subject,
        html
      }),
      mailgun); // Promise.promisify needs the context
  } else {
    console.warn("Warning: No mail sent - Mailgun is not configured");
    return Promise.resolve();
  }
};

/*
 * Given a template, recipient and data, generates email and sends it.
 * Deprecated. Should use sendMessageFromActivity() for sending new emails.
 */

const send = (template, recipient, data) => {

  const templates = loadTemplates();

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

  if (!templates[template]) return Promise.reject(new Error("Invalid email template"));

  const templateString = render(templates, template, data, config);

  return sendMessage(recipient, getSubject(templateString), getBody(templateString));
};


/*
 * Given an activity, it sends out the appropriate email
 */
const sendMessageFromActivity = () => {
  // TODO
};

module.exports = {

  loadTemplates,
  reload: loadTemplates, // needed for tests
  getBody,
  getSubject,
  sendMessage,
  send,
  sendMessageFromActivity,
};