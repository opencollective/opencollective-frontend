#!/usr/bin/env node
import '../server/env';

/**
 * Use ./scripts/watch_email_template.sh [template] to compile an email template
 */
import config from 'config';
import juice from 'juice';

import libEmailTemplates from '../server/lib/emailTemplates';
import { getMailer } from '../server/lib/email';

const templateName = process.argv[2];
const data = {};
data['user.new.token'] = {
  loginLink: 'https://opencollective.com/signin?next=',
};
data['onboarding.day21.noTwitter'] = {
  collective: {
    name: 'yeoman',
    slug: 'yeoman',
  },
};
data['onboarding.day2.opensource'] = data['onboarding.day7.opensource'] = data[
  'onboarding.noExpenses.opensource'
] = data['onboarding.day28'] = data['onboarding.day35.inactive'] = data['onboarding.day21.noTwitter'];
data['collective.expense.approved'] = {
  host: { id: 1, name: 'WWCode', slug: 'wwcode' },
  expense: {
    amount: 1250,
    currency: 'USD',
    privateMessage: 'Private instructions',
    attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/5bdc1850-60d9-11e7-9f4e-6f8999022d4b.JPG',
  },
  collective: { slug: 'wwcodeaustin', name: 'Women Who Code Austin' },
  fromCollective: { slug: 'xdamman', name: 'Xavier Damman' },
  user: { paypalEmail: 'email@paypal.com' },
  actions: {
    viewLatestExpenses: 'https://opencollective.com/wwcodeaustin/expenses',
  },
};
data['collective.expense.paid'] = {
  host: { id: 1, name: 'WWCode', slug: 'wwcode' },
  expense: {
    description: 'Team dinner',
    amount: 1250,
    currency: 'USD',
    privateMessage: 'Private instructions',
    payoutMethod: 'PayPal (paypal@domain.tld)',
    attachment: 'https://opencollective-production.s3-us-west-1.amazonaws.com/5bdc1850-60d9-11e7-9f4e-6f8999022d4b.JPG',
  },
  collective: {
    slug: 'wwcodeaustin',
    name: 'Women Who Code Austin',
  },
  fromCollective: {
    slug: 'xdamman',
    name: 'Xavier Damman',
  },
  user: { paypalEmail: 'email@paypal.com' },
  actions: {
    viewLatestExpenses: 'https://opencollective.com/wwcodeaustin/expenses',
  },
};
data['user.card.claimed'] = {
  currency: 'USD',
  initialBalance: 10000,
  expiryDate: new Date().setMonth(new Date().getMonth() + 3),
  emitter: {
    slug: 'triplebyte',
    name: 'Triplebyte',
    description:
      'Triplebyte lets talented software engineers skip resumes  recruiters and go straight to final interviews at multiple top tech companies at once.',
    image: 'https://opencollective-production.s3-us-west-1.amazonaws.com/02f87560-b2f1-11e8-85a0-75f200a0e2db.png',
    backgroundImage: 'https://d.pr/free/i/GEbbjb+',
    previewImage:
      'https://opencollective-production.s3-us-west-1.amazonaws.com/02f87560-b2f1-11e8-85a0-75f200a0e2db.png',
  },
  loginLink: 'https://opencollective.com/signin?next=',
};
data['user.card.invited'] = {
  currency: 'USD',
  initialBalance: 10000,
  expiryDate: new Date().setMonth(new Date().getMonth() + 3),
  emitter: {
    slug: 'triplebyte',
    name: 'Triplebyte',
    description:
      'Triplebyte lets talented software engineers skip resumes  recruiters and go straight to final interviews at multiple top tech companies at once.',
    image: 'https://opencollective-production.s3-us-west-1.amazonaws.com/02f87560-b2f1-11e8-85a0-75f200a0e2db.png',
    backgroundImage: 'https://d.pr/free/i/GEbbjb+',
    previewImage:
      'https://opencollective-production.s3-us-west-1.amazonaws.com/02f87560-b2f1-11e8-85a0-75f200a0e2db.png',
  },
  redeemCode: '00000000',
  email: 'info@opencolletive.com',
  customMessage: '',
};
data['ticket.confirmed'] = {
  recipient: {
    name: 'Xavier Damman',
  },
  event: {
    name: 'Sustain 2019 San Francisco',
    slug: 'sutain-2019-sf',
    startsAt: '2019-06-19 17:15:00+00',
    endsAt: '2019-06-19 21:15:00+00',
    timezone: 'America/Los_Angeles',
    locationName: 'Github HQ',
    address: '88 Colin P Kelly Jr Street, San Francisco, CA',
  },
  collective: {
    slug: 'sustainoss',
  },
  tier: {
    id: 1,
    name: 'Regular Ticket',
    description: 'This gives you access to all the workshops',
    amount: 1000,
    currency: 'USD',
  },
  order: {
    id: 2312321,
    quantity: 2,
    totalAmount: 5000,
    currency: 'USD',
  },
};
data['ticket.confirmed.sustainoss'] = data['ticket.confirmed'];
data['ticket.confirmed.fearlesscitiesbrussels'] = data['ticket.confirmed'];
data['github.signup'] = {
  collective: {
    name: 'webpack',
    slug: 'webpack',
  },
};
data['organization.collective.created'] = {
  collective: {
    slug: 'coinbase',
    name: 'Coinbase',
  },
};
data['collective.update.published'] = {
  collective: {
    id: 207,
    type: 'COLLECTIVE',
    slug: 'brusselstogether',
    name: 'BrusselsTogether',
    previewImage:
      'https://opencollective-production.s3-us-west-1.amazonaws.com/a9326d00-6b75-11e8-9927-4f9505022f01.png',
  },
  update: {
    id: 44,
    slug: 'testing-update-html',
    CollectiveId: 207,
    TierId: null,
    FromCollectiveId: 1729,
    CreatedByUserId: 2,
    LastEditedByUserId: null,
    title: 'Testing update html',
    markdown: '',
    html:
      '<p>The first stable release of rebar3 was a little over 2 years ago. Since that time dozens of contributors over those years it has kept a steady pace of improvement, but there is so much left to do to improve the daily development lives of Erlang developers.</p><p><br /></p><p>We\'ve started this collective in hopes of raising funds to cover both a few minimal expenses (domain registration, S3 hosting of binaries) and more dedicated development time. The coming work will be tracked on the github project https://github.com/erlang/rebar3/projects/1, a few of the main features and fixes we have planned are:</p><p><br /></p><p>* Multi-repo support</p><p>** Host the packages you need and only hit the global hexpm when it isn\'t found in your internal repo</p><p>* Hex.pm organizations</p><p>** Support for hosting private packages on the official hexpm</p><p>* Performance improvements</p><p>** Parallel compilation of applications</p><p>* Streamline appup and relup creation</p><p>* Integrate changes and functionality upstream to OTP</p><p>* Regular bugfixing</p><p><img src="https://i.imgur.com/YW5kaBu.jpg" /></p>',
    image: null,
    tags: null,
    deletedAt: null,
    fromCollective: {
      slug: 'xdamman',
      name: 'Xavier Damman',
      image: '',
    },
  },
};
data['report.platform'] = {
  year: 2019,
  month: 'January',
  hosts: [
    {
      host: 'opensource',
      currency: 'USD',
      HostCollectiveId: 11004,
      backers: 2978,
      activeCollectives: 370,
      totalRevenue: 56302723,
      hostFees: 2766001,
      platformFeesPaypal: 13060,
      platformFeesStripe: 655646,
      platformFeesManual: 2103163,
      platformFeesDue: 2116223,
      platformFees: 2771869,
      hostCurrency: 'USD',
      collectives: 1171,
    },
    {
      host: 'foundation',
      currency: 'USD',
      HostCollectiveId: 11049,
      backers: 54,
      activeCollectives: 16,
      totalRevenue: 826084,
      hostFees: 39252,
      platformFeesPaypal: 0,
      platformFeesStripe: 24380,
      platformFeesManual: 14947,
      platformFeesDue: 14947,
      platformFees: 39327,
      hostCurrency: 'USD',
      collectives: 55,
    },
    {
      host: 'faly',
      currency: 'CHF',
      HostCollectiveId: 8860,
      backers: 1,
      activeCollectives: 1,
      totalRevenue: 500,
      hostFees: 24,
      platformFeesPaypal: 0,
      platformFeesStripe: 24,
      platformFeesManual: 0,
      platformFeesDue: 0,
      platformFees: 24,
      hostCurrency: 'CHF',
      collectives: 1,
    },
    {
      host: 'tfavre',
      currency: 'EUR',
      HostCollectiveId: 8657,
      backers: 1,
      activeCollectives: 1,
      totalRevenue: 500,
      hostFees: 0,
      platformFeesPaypal: 0,
      platformFeesStripe: 25,
      platformFeesManual: 0,
      platformFeesDue: 0,
      platformFees: 25,
      hostCurrency: 'EUR',
      collectives: 1,
    },
    {
      host: 'ubie-user',
      currency: 'EUR',
      HostCollectiveId: 8643,
      backers: 7,
      activeCollectives: 1,
      totalRevenue: 3500,
      hostFees: 0,
      platformFeesPaypal: 0,
      platformFeesStripe: 175,
      platformFeesManual: 0,
      platformFeesDue: 0,
      platformFees: 175,
      hostCurrency: 'EUR',
      collectives: 1,
    },
  ],
  stats: {
    thisMonth: {
      backers: {
        total: 11202,
        repeat: 3028,
        new: 688,
        inactive: 7486,
      },
      platformFees: {
        currency: 'USD',
        amount: 5846108,
      },
      platformFeesByCurrency: [
        {
          currency: 'USD',
          amount: 5774252,
        },
        {
          currency: 'EUR',
          amount: 46510,
        },
        {
          currency: 'MXN',
          amount: 12000,
        },
        {
          currency: 'GBP',
          amount: 4930,
        },
        {
          currency: 'CAD',
          amount: 1884,
        },
      ],
      hosts: {
        active: 60,
        new: 22,
        total: 182,
      },
    },
    previousMonth: {
      backers: {
        total: 10514,
        repeat: 3060,
        new: 646,
        inactive: 6808,
      },
      platformFees: {
        currency: 'USD',
        amount: 1775496,
      },
      platformFeesByCurrency: [
        {
          currency: 'USD',
          amount: 1694428,
        },
        {
          currency: 'EUR',
          amount: 53168,
        },
        {
          currency: 'MXN',
          amount: 15000,
        },
        {
          currency: 'GBP',
          amount: 5530,
        },
        {
          currency: 'AUD',
          amount: 0,
        },
        {
          currency: 'CAD',
          amount: 0,
        },
      ],
      hosts: {
        active: 55,
        new: 12,
        total: 160,
      },
    },
    delta: {
      platformFees: {
        currency: 'USD',
        amount: 4070612,
      },
      platformFeesByCurrency: [
        {
          currency: 'USD',
          amount: 4079824,
        },
        {
          currency: 'EUR',
          amount: -6658,
        },
        {
          currency: 'MXN',
          amount: -3000,
        },
        {
          currency: 'GBP',
          amount: -600,
        },
        {
          currency: 'CAD',
          amount: 1884,
        },
        {},
      ],
      backers: {
        total: 688,
        repeat: -32,
        new: 42,
        inactive: 678,
      },
      hosts: {
        active: 5,
        new: 10,
        total: 22,
      },
    },
  },
};
data['user.monthlyreport'] = {
  recipient: { firstName: 'Xavier' },
  month: 'march',
  year: '2017',
  manageSubscriptionsUrl: 'https://opencollective.com/subscriptions',
  utm: Date.now(),
  fallbackUrl: 'opencollective.com/email/some_id',
  subscriptions: [
    {
      amount: 10 * 100,
      interval: 'month',
      createdAt: Date.now(),
      currency: 'USD',
      collective: {
        publicUrl: 'cycle.js.org',
        name: 'Between the Wires',
        slug: 'cyclejs',
        image: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
        backgroundImage: 'http://opencollective.com/proxy/images/?src=https://cldup.com/Gj243bgI0f.jpg&width=1024',
        mission:
          'We are on a mission to explore and develop new technologies for psychological, emotional and spiritual flourishing.',
        stats: {
          backers: {
            lastMonth: 11,
            new: 3,
            lost: 1,
          },
          balance: 1596 * 100,
          totalDonations: 82 * 100,
          totalExpenses: 25 * 100,
        },
      },
    },
    {
      amount: 10 * 100,
      interval: 'month',
      createdAt: Date.now(),
      currency: 'USD',
      collective: {
        publicUrl: 'cycle.js.org',
        name: 'Between the Wires',
        slug: 'cyclejs',
        image: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
        backgroundImage: 'http://opencollective.com/proxy/images/?src=https://cldup.com/Gj243bgI0f.jpg&width=1024',
        mission:
          'We are on a mission to explore and develop new technologies for psychological, emotional and spiritual flourishing.',
        stats: {
          backers: {
            lastMonth: 11,
            new: 3,
            lost: 1,
          },
          balance: 1596 * 100,
          totalDonations: 82 * 100,
          totalExpenses: 25 * 100,
        },
      },
    },
  ],
  relatedCollectives: [
    {
      currency: 'USD',
      image: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
      backgroundImage: 'http://opencollective.com/proxy/images/?src=https://cldup.com/Gj243bgI0f.jpg&width=1024',
      slug: 'cyclejs',
      name: 'Cycle.js',
      mission: 'We are on a mission to provide a framework for clean code, easy debugging experience, and fun.',
      // totalDonations: 41,
      tier: 'backer',
      yearlyIncome: 6271 * 100,
      contributorsCount: 0,
    },
    {
      currency: 'USD',
      image: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
      backgroundImage: 'http://opencollective.com/proxy/images/?src=https://cldup.com/Gj243bgI0f.jpg&width=1024',
      slug: 'cyclejs',
      name: 'Cycle.js',
      mission: 'We are on a mission to provide a framework for clean code, easy debugging experience, and fun.',
      // totalDonations: 41,
      tier: 'backer',
      yearlyIncome: 6271 * 100,
      contributorsCount: 0,
    },
    {
      currency: 'USD',
      image: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
      backgroundImage: 'http://opencollective.com/proxy/images/?src=https://cldup.com/Gj243bgI0f.jpg&width=1024',
      slug: 'cyclejs',
      name: 'Cycle.js',
      mission: 'We are on a mission to provide a framework for clean code, easy debugging experience, and fun.',
      // totalDonations: 41,
      tier: 'backer',
      yearlyIncome: 6271 * 100,
      contributorsCount: 0,
    },
  ],
};

data['pledge.complete'] = {
  collective: {
    name: 'Johnny Five',
    slug: 'johnny-five',
  },
  fromCollective: {
    name: 'Jane Doe',
    slug: 'jane-doe',
  },
  interval: 'month',
  order: {
    currency: 'USD',
    id: '123456',
    totalAmount: 1000,
  },
};

const defaultData = {
  config: {
    host: {
      website: process.env.WEBSITE_URL || 'https://opencollective.com',
    },
  },
};

/*
 * Gets the body from a string (usually a template)
 */
const getTemplateAttributes = str => {
  let index = 0;
  const lines = str.split('\n');
  const attributes = {};
  let tokens;
  do {
    tokens = lines[index++].match(/^([a-z]+):(.+)/i);
    if (tokens) {
      attributes[tokens[1].toLowerCase()] = tokens[2].replace(/<br( \/)?>/g, '\n').trim();
    }
  } while (tokens);

  attributes.body = lines
    .slice(index)
    .join('\n')
    .trim();
  return attributes;
};

if (!templateName) {
  console.log('\nCompiles a registered email template to stdout.\n');
  console.log('Usage: npm run compile:email <name>\n');
  console.log('Where <name> is the name of a template found in:');
  console.log('./server/lib/emailTemplates\n');
  console.log('  Example 1: npm run -s compile:email user.monthlyreport\n');
  console.log('  Example 2: npm run -s compile:email email.approve > email-approve.html\n');
  console.log('Note: `-s` switch is requried to suppress warnings from npm.');
  console.log('Note: Edit the script to specify the data that is passed to the template.');
} else if (!data[templateName]) {
  console.log('There is no mocked data defined for this template.');
  console.log('Please add mocked data by editing `scripts/compile-email.js`.');
} else {
  const template = libEmailTemplates[templateName];
  if (template) {
    const emailData = { ...data[templateName], ...defaultData };
    const html = juice(template(emailData));
    let text;
    if (libEmailTemplates[`${templateName}.text`]) {
      text = libEmailTemplates[`${templateName}.text`](emailData);
    }
    const mailer = getMailer();
    if (mailer) {
      const attributes = getTemplateAttributes(html);
      const to = process.env.ONLY || 'test@opencollective.com';
      console.log('>>> Sending by email to ', to);
      mailer.sendMail(
        {
          from: config.email.from,
          to,
          subject: attributes.subject,
          text,
          html: attributes.body,
        },
        () => {
          console.log('email sent');
        },
      );
    }
    process.stdout.write(html);
  } else {
    console.log(`The email template "${templateName}" does not exist.`);
  }
}
