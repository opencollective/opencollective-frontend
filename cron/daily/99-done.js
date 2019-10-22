#!/usr/bin/env node
import '../../server/env';

import email from '../../server/lib/email';

const recipients = 'ops@opencollective.com';

const subject = 'Daily Cron Job completed';

const text = 'The Daily Cron Job successfully completed again today.';

const html = text;

return email.sendMessage(recipients, subject, html, { text });
