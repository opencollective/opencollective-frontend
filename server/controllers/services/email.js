/**
 * Dependencies.
 */
import emailLib from '../../lib/email';
import Promise from 'bluebird';
import config from 'config';
import request from 'request-promise';
import _ from 'lodash';
import crypto from 'crypto';
import debug from 'debug';

/**
 * Controller.
 */
export default (app) => {

  const models = app.set('models');
  const { errors } = app;

  const unsubscribe = (req, res, next) => {

    const { type } = req.params;
    const { email } = req.params;
    const { slug } = req.params;

    const identifier = `${email}.${slug}.${type}.${config.keys.opencollective.resetPasswordSecret}`;
    const token = crypto.createHash('md5').update(identifier).digest("hex");

    if (token !== req.params.token) {
      return next(new errors.BadRequest('Invalid token'));
    }

    models.Notification.findOne({
      where: {
        type
      },
      include: [
        { model: models.User, where: { email }},
        { model: models.Group, where: { slug }}
      ]
    })
    .then(notification => {
      if (!notification) throw new errors.BadRequest('No notification found for this user, group and type');
      return notification.update({ active: false })
    })
    .then(() => res.send({"response": "ok"}))
    .catch(next);

  };

  const fetchSubscribers = (groupSlug, type) => {
    return models.Notification.findAll(
      {
        where: {
          channel: 'email',
          type
        },
        include: [{model: models.User }, {model: models.Group, where: { slug: groupSlug } }]
      }
    );
  };

  // TODO: move to emailLib.js
  const sendEmailToList = (to, email) => {
    const tokens = to.match(/(.+)@(.+)\.opencollective\.com/i);
    const list = tokens[1];
    const slug = tokens[2];
    const type = `mailinglist.${list}`;
    email.from = email.from || `${slug} collective <info@${slug}.opencollective.com>`;
    email.group = email.group || { slug }; // used for the unsubscribe url

    return fetchSubscribers(slug, type)
    .tap(subscribers => {
      if (subscribers.length === 0) return mailinglistNotFound(recipient);
    })
    .then(results => results.map(r => r.User.email))
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

  const approve = (req, res, next) => {
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

      request
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
          sender: _.pick(sender, ['email', 'name', 'avatar'])
        }
        if ( approver && approver.email !== sender.email )
          emailData.approver = _.pick(approver, ['email', 'name', 'avatar']);
        
        return sendEmailToList(email.To, emailData);
      })
      .then(() => res.send(`Email from ${email.sender} with subject "${email.Subject}" approved for the ${email.To} mailing list`))
      .catch(e => {
        if (e.statusCode === 404) return next(new errors.NotFound(`Message ${messageId} not found on the ${mailserver} server`));
        else return next(e);
      })
  };
  
  const webhook = (req, res, next) => {
    const email = req.body;
    const { recipient } = email;

    const tokens = recipient.match(/(.+)@(.+)\.opencollective\.com/i);
    const list = tokens[1];
    const slug = tokens[2];

    const body = email['body-html'] || email['body-plain'];

    let group;

    // If receive an email that has already been processed, we skip it
    // (it happens since we send the approved email to the mailing list and add the recipients in /bcc)
    if (body.indexOf('<!-- OpenCollective.com -->') !== -1 ) {
      console.log(`Email from ${email.from} with subject ${email.subject} already processed, skipping`);
      return res.send('Email already processed, skipping');
    }

    // If an email is sent to info@:slug.opencollective.com,
    // we simply forward it to members who subscribed to that list
    if (list === 'info') {
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

    models.Group.find({ where: { slug } })
      .tap(g => {
        if (!g) throw new Error('group_not_found');
        group = g;
      })
      .then(group => fetchSubscribers(group.slug, `mailinglist.${list}`))
      .tap(subscribers => {
        if (subscribers.length === 0) throw new Error('no_subscribers');
      })
      .then(() => {
        return models.sequelize.query(`
          SELECT * FROM "UserGroups" ug LEFT JOIN "Users" u ON ug."UserId"=u.id WHERE ug."GroupId"=:groupid AND ug.role=:role AND ug."deletedAt" IS NULL
        `, {
          replacements: { groupid: group.id, role: 'MEMBER' },
          model: models.User
        });
      })
      .tap(members => {
        if (members.length === 0) throw new Error('no_members');
      })
      .then(users => {
        const messageId = email['message-url'].substr(email['message-url'].lastIndexOf('/')+1);
        const mailserver = email['message-url'].substring(8, email['message-url'].indexOf('.'));
        const getData = (user) => {
          return {
            from: email.from,
            to: recipient,
            subject: email.subject,
            body: email['body-html'] || email['body-plain'],
            approve_url: `${config.host.website}/api/services/email/approve?mailserver=${mailserver}&messageId=${messageId}&approver=${encodeURIComponent(user.email)}`
          };
        };
        debug('preview')("Preview", `http://localhost:3060/templates/email/email.approve?data=${encodeURIComponent(JSON.stringify(getData(users[0])))}`);
        return Promise.map(users, (user) => emailLib.send('email.approve', `members@${slug}.opencollective.com`, getData(user), {bcc:user.email}));
      })
      .then(() => res.send('Mailgun webhook processed successfully'))
      .catch(e => {
        switch (e.message) {
          case 'no_subscribers':
            /**
             * TODO
             * If there is no such mailing list,
             * - if the sender is a MEMBER, we send an email to confirm to create the mailing list
             *   with the people in /cc as initial subscribers
             * - if the sender is unknown, we return an email suggesting to contact info@:slug.opencollective.com
             */
            return res.send({error: { message: `There is no user subscribed to ${recipient}` }});
          case 'group_not_found':
            /**
             * TODO
             * If there is no such collective, we send an email to confirm to create the collective
             * with the people in /cc as initial members
             */
            return res.send({error: { message: `There is no group with slug ${slug}` }});
          case 'no_members':
            return res.send({error: { message: `There is no members to approve emails sent to ${email.recipient}` }});
          default:
            return next(e);
        }
      });
  };

  return { webhook, approve, unsubscribe };

};