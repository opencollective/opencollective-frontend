import sanitizeHtml from 'sanitize-html';

import { sendMessage } from '../../lib/email';

export default async function handle(req, res) {
  const body = req.body;

  if (!(body && body.name && body.email && body.message)) {
    res.status(500).send('All inputs required');
  }

  const additionalLink = body.link ? `Additional Link: <a href="https://${body.link}">${body.link}</a></br>` : '';

  await sendMessage({
    to: 'support@opencollective.com',
    from: 'Open Collective <info@opencollective.com>',
    subject: 'Email support Form',
    html: sanitizeHtml(`
          Name: <strong>${body.name}</strong></br>
          Email: <strong>${body.email}</strong></br>
          Topic: <strong>${body.topic}</strong></br>
          ${additionalLink}
          </br>${body.message}
      `),
  });

  res.status(200).send({ sent: true });
}
