import nodemailer from 'nodemailer';

let mailgun;

const getMailgun = () => {
  if (!mailgun) {
    const transport = {
      service: 'Mailgun',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD,
      },
    };
    mailgun = nodemailer.createTransport(transport);
  }
  return mailgun;
};

const sendMessage = (options = {}) => {
  const { from, cc, to, bcc, subject, text, html, headers = {}, attachments, tag } = options;

  headers['X-Mailgun-Dkim'] = 'yes';
  if (tag) {
    headers['X-Mailgun-Tag'] = tag;
  }

  return new Promise((resolve, reject) => {
    getMailgun().sendMail({ from, cc, to, bcc, subject, text, html, headers, attachments }, (err, info) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(info);
      }
    });
  });
};

export default {
  sendMessage,
};
