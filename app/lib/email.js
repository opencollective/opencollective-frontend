var fs = require('fs');
var handlebars = require('handlebars');
var templatesList = fs.readdirSync(__dirname + '/../../templates/emails/');
var config = require('config');
var moment = require('moment');

/*** 
 * Loading Handlebars templates for the HTML emails
 */
var templates = {};
loadTemplates = function() {
  handlebars.registerPartial('header', fs.readFileSync(__dirname + '/../../templates/partials/header.hbs', 'utf8'));
  handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/../../templates/partials/footer.hbs', 'utf8'));
  handlebars.registerHelper('moment', function(value) {
    return moment(value).format('MMMM Do YYYY');
  });
  handlebars.registerHelper('currency', function(value, props) {
    const currency = props.hash.currency;
    switch(currency) {
      case 'USD':
        return '$' + value;
      case 'EUR':
        return '€' + value;
      case 'GBP':
        return '£' + value;
      case 'SEK':
        return 'kr ' + value;
      default:
        return value + ' ' + currency;
    }
  });

  templatesList.forEach(function(template) {
    var source = fs.readFileSync(__dirname + '/../../templates/emails/' + template, 'utf8');
    templates[template.replace('.hbs','')] = handlebars.compile(source);
  });
}

loadTemplates();

var EmailLib = function(app) {

  getSubject = function(templateString) {
    return templateString.split('\n')[0].replace(/^Subject: ?/i, '');
  };

  getBody = function(templateString) {
    return templateString.split('\n').slice(2).join('\n');
  };

  send = function(template, recipient, data, cb) {

    cb = cb || function() {};
    data.config = config;

   if(!templates[template]) return cb(new Error("Invalid email template"));

    var templateString = templates[template](data);

    var subject = getSubject(templateString);
    var body = getBody(templateString);

    app.mailgun.sendMail({
      from: config.email.from,
      to: recipient,
      subject: subject,
      html: body
    }, function(err) {
      if (err) {
        console.error(err);
        cb(err);
      }
      cb();
    });
  }

  return {
    send: send,
    templates: templates,
    getBody: getBody,
    reload: loadTemplates,
    getSubject: getSubject
  };

}

module.exports = EmailLib;
