const nodemailer = require('nodemailer');
const sanitizeHtml = require('sanitize-html');

const getMailgun = () => {
  const transport = {
    service: 'Mailgun',
    auth: {
      user: process.env.MAILGUN_USER,
      pass: process.env.MAILGUN_PASSWORD,
    },
  };

  return nodemailer.createTransport(transport);
};

const sendMessage = (options = {}) => {
  const { from, cc, to, bcc, subject, text, headers = {}, attachments, tag } = options;

  const html = sanitizeHtml(options.html);

  headers['X-Mailgun-Dkim'] = 'yes';
  if (tag) {
    headers['X-Mailgun-Tag'] = tag;
  }

  return new Promise((resolve, reject) => {
    getMailgun().sendMail({ from, cc, to, bcc, subject, text, html, headers, attachments }, (err, info) => {
      console.log({ err, info });
      if (err) {
        return reject(err);
      } else {
        return resolve(info);
      }
    });
  });
};

module.exports = { sendMessage };
