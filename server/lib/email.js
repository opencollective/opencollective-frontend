const fs = require('fs');
const handlebars = require('handlebars');
const config = require('config');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');

const templatesNames = [
  'github.signup',
  'group.transaction.created',
  'thankyou',
  'thankyou.wwcode',
  'thankyou.ispcwa',
  'thankyou.fr',
  'thankyou.laprimaire',
  'user.forgot.password',
  'user.new.token'
];

/**
 * Helpers
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
}
const getBody = str => str.split('\n').slice(2).join('\n');
const render = (name, data, config) => {
  data.config = config;
  data.logoNotSvg = data.group && data.group.logo && !data.group.logo.endsWith('.svg');
  return templates[name](data);
};

/***
 * Loading Handlebars templates for the HTML emails
 */
var templates = {};
function loadTemplates() {
  const templatesPath = `${__dirname}/../../templates`;

  // Register partials
  const header = fs.readFileSync(`${templatesPath}/partials/header.hbs`, 'utf8');
  const footer = fs.readFileSync(`${templatesPath}/partials/footer.hbs`, 'utf8');
  const subscriptions = fs.readFileSync(`${templatesPath}/partials/subscriptions.hbs`, 'utf8');

  handlebars.registerPartial('header', header);
  handlebars.registerPartial('footer', footer);
  handlebars.registerPartial('subscriptions', subscriptions);

  handlebars.registerHelper('moment', (value) => {
    return moment(value).format('MMMM Do YYYY');
  });

  handlebars.registerHelper('currency', (value, props) => {
    const currency = props.hash.currency;
    switch(currency) {
      case 'USD':
        return `$${value}`;
      case 'EUR':
        return `€${value}`;
      case 'GBP':
        return `£${value}`;
      case 'SEK':
        return `kr ${value}`;
      case 'UYU':
        return `$U ${value}`;
      case 'INR':
        return `₹${value}`;
      default:
        return `${value} ${currency}`;
    }
  });

  handlebars.registerHelper('encodeURIComponent', (str) => {
    return encodeURIComponent(str);
  });

  templatesNames.forEach((template) => {
    var source = fs.readFileSync(`${templatesPath}/emails/${template}.hbs`, 'utf8');
    templates[template] = handlebars.compile(source);
  });
};

loadTemplates();

/**
 * Mailgun wrapper
 */
const EmailLib = (app) => {

  const send = (template, recipient, data) => {

    if(template === 'thankyou') {
      if(data.group.name.match(/WWCode/i))
        template += '.wwcode';
      if(data.group.name.match(/ispcwa/i))
        template += '.ispcwa';
      if(_.contains(['lesbarbares', 'nuitdebout', 'laprimaire'], data.group.slug)) {
        template += '.fr';

        if(data.group.slug === 'laprimaire')
          template = 'thankyou.laprimaire';

        // xdamman: hack
        switch(data.interval) {
          case 'month':
            data.interval = 'mois';
            break;
          case 'year':
            data.interval = 'an';
            break;
        }
      }
    }

    if(!templates[template]) return Promise.reject(new Error("Invalid email template"));

    const templateString = render(template, data, config);

    return app.mailgun.sendMail({
      from: config.email.from,
      to: recipient,
      bcc: 'ops@opencollective.com',
      subject: getSubject(templateString),
      html: getBody(templateString)
    });
  };

  return {
    send,
    templates,
    getBody,
    getSubject,
    reload: loadTemplates
  };

}

module.exports = EmailLib;
