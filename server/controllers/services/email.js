import emailLib from '../../lib/email';
import Promise from 'bluebird';
import config from 'config';
import request from 'request-promise';
import _ from 'lodash';
import crypto from 'crypto';
import debug from 'debug';
import models, {sequelize} from '../../models';
import errors from '../../lib/errors';

export const unsubscribe = (req, res, next) => {

  const { type, email, slug, token } = req.params;

  const identifier = `${email}.${slug || 'any'}.${type}.${config.keys.opencollective.secret}`;
  const computedToken = crypto.createHash('md5').update(identifier).digest("hex");
  if (token !== computedToken) {
    return next(new errors.BadRequest('Invalid token'));
  }

  Promise.all([
    models.Collective.findOne({ where: { slug }}),
    models.User.findOne({ where: { email }})
  ]).then(results => {
    if (!results[1]) throw new errors.NotFound(`Cannot find a user with email "${email}"`);

    return results[1].unsubscribe(results[0] && results[0].id, type, 'email')
    })
  .then(() => res.send({"response": "ok"}))
  .catch(next);

};

// TODO: move to emailLib.js
const sendEmailToList = (to, email) => {
  const { mailinglist, collectiveSlug, type } = getNotificationType(to);  
  email.from = email.from || `${collectiveSlug} collective <hello@${collectiveSlug}.opencollective.com>`;
  email.collective = email.collective || { slug: collectiveSlug }; // used for the unsubscribe url

  return models.Notification.getSubscribers(collectiveSlug, mailinglist)
  .tap(subscribers => {
    if (subscribers.length === 0) throw new errors.NotFound(`No subscribers found in ${collectiveSlug} for email type ${type}`);
  })
  .then(results => results.map(r => r.email))
  .then(recipients => {
    console.log(`Sending email from ${email.from} to ${to} (${recipients.length} recipient(s))`);
    return Promise.map(recipients, (recipient) => {
      if (email.template) {
        debug('preview')(`preview: http://localhost:3060/templates/email/${email.template}?data=${encodeURIComponent(JSON.stringify(email))}`);
        return emailLib.send(email.template, to, email, { from: email.from, bcc: recipient, type });
      } else {
        debug('preview')("Subject: ", email.subject);
        email.body += '\n<!-- OpenCollective.com -->\n'; // watermark to identify if email has already been processed
        return emailLib.sendMessage(to, email.subject, email.body, { from: email.from, bcc: recipient, type });
      }
    });
  })
  .catch(e => {
    console.error("error in sendEmailToList", e);
  });
};

export const approve = (req, res, next) => {
    const { messageId } = req.query;
    const approverEmail = req.query.approver;
    const mailserver = req.query.mailserver || 'so';

    let approver, sender;
    let email = {};

    const fetchSenderAndApprover = (email) => {
      const where = { '$or': [ {email: approverEmail}, { email: email.sender } ] };
      sender = { name: email.From, email: email.sender }; // default value
      return models.User.findAll({ where })
              .then(users => {
                users.map(user => {
                  if (approverEmail === user.email) approver = user;
                  if (email.sender === user.email) sender = user;
                })
              })
              .catch(e => {
                console.error("err: ", e);
              });
    };

    const requestOptions = {
      json: true,
      auth: {
        user: 'api',
        pass: config.mailgun.api_key
      }
    };

    return request
    .get(`https://${mailserver}.api.mailgun.net/v3/domains/opencollective.com/messages/${messageId}`, requestOptions)
    .then(json => {
      email = json;
      return email;
    })
    .then(fetchSenderAndApprover)
    .then(() => {
      const emailData = {
        template: 'email.message',
        subject: email.Subject,
        body: email['body-html'] || email['body-plain'],
        to: email.To,
        sender: _.pick(sender, ['email', 'name', 'image'])
      }
      if ( approver && approver.email !== sender.email )
        emailData.approver = _.pick(approver, ['email', 'name', 'image']);

      return sendEmailToList(email.To, emailData);
    })
    .then(() => res.send(`Email from ${email.sender} with subject "${email.Subject}" approved for the ${email.To} mailing list`))
    .catch(e => {
      if (e.statusCode === 404) return next(new errors.NotFound(`Message ${messageId} not found on the ${mailserver} server`));
      else return next(e);
    })
};

export const getNotificationType = (email) => {
  const tokens = email.match(/(.+)@(.+)\.opencollective\.com/i);
  const collectiveSlug = tokens[2];
  let mailinglist = tokens[1];
  if (['info','hello','members','admins', 'admins'].indexOf(mailinglist) !== -1) {
    mailinglist = 'admins';
  }
  const type = `mailinglist.${mailinglist}`;
  return { collectiveSlug, mailinglist, type };
}

export const webhook = (req, res, next) => {
  const email = req.body;
  const { recipient } = email;
  debug('webhook')(">>> webhook received", JSON.stringify(email));
  const { mailinglist, collectiveSlug } = getNotificationType(recipient);

  const body = email['body-html'] || email['body-plain'];

  let collective;

  // If receive an email that has already been processed, we skip it
  // (it happens since we send the approved email to the mailing list and add the recipients in /bcc)
  if (body.indexOf('<!-- OpenCollective.com -->') !== -1 ) {
    console.log(`Email from ${email.from} with subject ${email.subject} already processed, skipping`);
    return res.send('Email already processed, skipping');
  }

  // If an email is sent to [info|hello|members|admins|organizers]@:collectiveSlug.opencollective.com,
  // we simply forward it to admins who subscribed to that mailinglist (no approval process)
  if (mailinglist === 'admins') {
    return sendEmailToList(recipient, {
      subject: email.subject,
      body,
      from: email.from
    })
    .then(() => res.send('ok'))
    .catch(e => {
      console.error("Error: ", e);
      next(e);
    });
  }  

  // If the email is sent to :tierSlug or :eventSlug@:collectiveSlug.opencollective.com
  // We leave the original message on the mailgun server
  // and we send the email to the admins of the collective for approval
  // once approved, we will fetch the original email from the server and send it to all recipients
  let subscribers;

  models.Collective.find({ where: { slug: collectiveSlug } })
    .tap(g => {
      if (!g) throw new Error('collective_not_found');
      collective = g;
    })
    // We fetch all the recipients of that mailing list to give a preview in the approval email
    .then(collective => models.Notification.getSubscribers(collective.slug, mailinglist))
    .tap(results => {
      if (results.length === 0) throw new Error('no_subscribers');
      subscribers = results.map(s => {
        s.roundedAvatar = `https://res.cloudinary.com/opencollective/image/fetch/c_thumb,g_face,h_48,r_max,w_48,bo_3px_solid_white/c_thumb,h_48,r_max,w_48,bo_2px_solid_rgb:66C71A/e_trim/f_auto/${encodeURIComponent(s.image)}`;
        return s;
      });
    })
    // We fetch all the admins of the collective to whom we will send the email to approve
    .then(() => {
      return sequelize.query(`
        SELECT * FROM "Users" u
        LEFT JOIN "Members" m ON m."CreatedByUserId"=u.id
        WHERE m."CollectiveId"=:collectiveid AND m.role=:role AND m."deletedAt" IS NULL
      `, {
        replacements: { collectiveid: collective.id, role: 'ADMIN' },
        model: models.User
      });
    })
    .tap(admins => {
      if (admins.length === 0) throw new Error('no_admins');
    })
    .then(admins => {
      const messageId = email['message-url'].substr(email['message-url'].lastIndexOf('/')+1);
      const mailserver = email['message-url'].substring(8, email['message-url'].indexOf('.'));
      const getData = (user) => {
        return {
          from: email.from,
          subject: email.subject,
          body: email['body-html'] || email['body-plain'],
          subscribers,
          latestSubscribers: subscribers.slice(0,15),
          approve_url: `${config.host.website}/api/services/email/approve?mailserver=${mailserver}&messageId=${messageId}&approver=${encodeURIComponent(user.email)}`
        };
      };
      // We send the email to each admin with
      // to: admins@:collectiveSlug.opencollective.com
      // bcc: admin.email
      // body: includes mailing list, recipients, preview of the email and approve button
      return Promise.map(admins, (admin) => emailLib.send('email.approve', `admins@${collectiveSlug}.opencollective.com`, getData(admin), { bcc: admin.email }));
    })
    .then(() => res.send('Mailgun webhook processed successfully'))
    .catch(e => {
      switch (e.message) {
        case 'no_subscribers':
          /**
           * TODO
           * If there is no such mailing list,
           * - if the sender is a ADMIN, we send an email to confirm to create the mailing list
           *   with the people in /cc as initial subscribers
           * - if the sender is unknown, we return an email suggesting to contact info@:collectiveSlug.opencollective.com
           */
          return res.send({error: { message: `There is no user subscribed to ${recipient}` }});
        case 'collective_not_found':
          /**
           * TODO
           * If there is no such collective, we send an email to confirm to create the collective
           * with the people in /cc as initial admins
           */
          return res.send({error: { message: `There is no collective with slug ${collectiveSlug}` }});
        case 'no_admins':
          return res.send({error: { message: `There is no admins to approve emails sent to ${email.recipient}` }});
        default:
          return next(e);
      }
    });
};
