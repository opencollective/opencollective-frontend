const fs = require('fs');
const handlebars = require('handlebars');
const config = require('config');

const templatesNames = [
  'group.transaction.created',
  'user.forgot.password'
];
var templates = {};

/***
 * Loading Handlebars templates for the HTML emails
 */

loadTemplates();

/**
 * Helpers
 */

const getSubject = str => str.split('\n')[0].replace(/^Subject: ?/i, '');

const getBody = str => str.split('\n').slice(2).join('\n');

const render = (name, data, config) => {
  data.config = config;
  return templates[name](data);
};

/**
 * Mailgun wrapper
 */

const EmailLib = (app) => {

  const send = (template, recipient, data) => {

    const templateString = render(template, data, config);

    return new Promise((resolve, reject) => {
      app.mailgun.sendMail({
        from: config.email.from,
        to: recipient,
        subject: getSubject(templateString),
        html: getBody(templateString)
      }, err => {
        if (err) {
          console.error(err);
          return reject(err);
        }

        resolve();
      });
    });
  };

  return {
    send,
    templates,
    getBody,
    getSubject
  };

}

function loadTemplates() {
  const templatesPath = __dirname + '/../../templates';

  // Register partials
  const header = fs.readFileSync(`${templatesPath}/partials/header.hbs.html`, 'utf8');
  const footer = fs.readFileSync(`${templatesPath}/partials/footer.hbs.html`, 'utf8');

  handlebars.registerPartial('header', header);
  handlebars.registerPartial('footer', footer);

  templatesNames.forEach((template) => {
    var source = fs.readFileSync(`${templatesPath}/emails/${template}.hbs.html`, 'utf8');
    templates[template] = handlebars.compile(source);
  });
};

module.exports = EmailLib;
