const fs = require('fs');
const handlebars = require('handlebars');
const config = require('config');
const templatesList = [
  'group.transaction.created',
  'user.forgot.password'
];

/***
 * Loading Handlebars templates for the HTML emails
 */
var templates = {};
handlebars.registerPartial('header', fs.readFileSync(__dirname + '/../../templates/partials/header.hbs.html', 'utf8'));
handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/../../templates/partials/footer.hbs.html', 'utf8'));
templatesList.forEach(function(template) {
  var source = fs.readFileSync(__dirname + '/../../templates/emails/' + template + '.hbs.html', 'utf8');
  templates[template] = handlebars.compile(source);
});

var EmailLib = function(app) {

  var getSubject = function(templateString) {
    return templateString.split('\n')[0].replace(/^Subject: ?/i, '');
  };

  var getBody = function(templateString) {
    return templateString.split('\n').slice(2).join('\n');
  };

  var send = function(template, recipient, data, cb) {

    cb = cb || function() {};
    data.config = config;

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
    getSubject: getSubject
  };

}

module.exports = EmailLib;
