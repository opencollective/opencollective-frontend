var fs = require('fs');
var handlebars = require('handlebars');
var templatesList = ['group.transaction.created'];
var config = require('config');

var templates = {};
templatesList.forEach(function(template) {
  var source = fs.readFileSync(__dirname + '/../../templates/emails/' + template + '.html.hbs', 'utf8');
  templates[template] = handlebars.compile(source);
});

var EmailLib = function(app) {

  getSubject = function(templateString) {
    return templateString.split('\n')[0].replace(/^Subject: ?/i, '');
  };

  getBody = function(templateString) {
    return templateString.split('\n').slice(2).join('\n');
  };

  send = function(template, recipient, data, cb) {

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
      if (err) console.error(err);
      if (cb) cb();
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
