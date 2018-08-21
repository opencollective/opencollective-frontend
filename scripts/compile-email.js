import nodemailer from 'nodemailer';
import config from 'config';

const templateName =  process.argv[2];
const data = {};
data['user.new.token'] = {
  loginLink: "https://opencollective.com/signin?next="
}
data['onboarding.day21.noTwitter'] = {
  collective: {
    name: "yeoman",
    slug: "yeoman"
  }
};
data['onboarding.day28'] = data['onboarding.day35.inactive'] = data['onboarding.day21.noTwitter'];
data['collective.expense.approved'] = {
  host: { id: 1, name: "WWCode", slug: "wwcode" },
  expense: { amount: 1250, currency: "USD", privateMessage: "Private instructions", attachment: "https://opencollective-production.s3-us-west-1.amazonaws.com/5bdc1850-60d9-11e7-9f4e-6f8999022d4b.JPG" },
  collective: { slug: "wwcodeaustin", name: "Women Who Code Austin"},
  fromCollective: { slug: "xdamman", name: "Xavier Damman"},
  user: { paypalEmail: "email@paypal.com" },
  actions: {
    viewLatestExpenses: "https://opencollective.com/wwcodeaustin/expenses"
  }
};
data['ticket.confirmed'] = {
  user: {
    name: "Xavier Damman"
  },
  event: {
    name: "SustainOSS",
    startsAt: "2017-06-19 17:15:00+00",
    timezone: "America/Los_Angeles",
    location: {
      name: "Github HQ",
      address: "88 Colin P Kelly Jr Street, San Francisco, CA"
    }
  },
  response: {
    quantity: 2,
  },
  donation: {
    amount: 5000,
    currency: "USD"
  },
  collective: {
    slug: "sustainoss",
    name: "SustainOSS"
  }
};
data['ticket.confirmed.sustainoss'] = data['ticket.confirmed'];
data['github.signup'] = {
  collective: {
    name: "webpack",
    slug: "webpack"
  }
};
data['organization.collective.created'] = {
  collective: {
    slug: "coinbase",
    name: "Coinbase"
  }
}
data['collective.update.published'] = {
  collective: {
    id: 207,
    type: 'COLLECTIVE',
    slug: 'brusselstogether',
    name: 'BrusselsTogether',
    previewImage: 'https://opencollective-production.s3-us-west-1.amazonaws.com/a9326d00-6b75-11e8-9927-4f9505022f01.png'
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
    html: "<p>The first stable release of rebar3 was a little over 2 years ago. Since that time dozens of contributors over those years it has kept a steady pace of improvement, but there is so much left to do to improve the daily development lives of Erlang developers.</p><p><br /></p><p>We've started this collective in hopes of raising funds to cover both a few minimal expenses (domain registration, S3 hosting of binaries) and more dedicated development time. The coming work will be tracked on the github project https://github.com/erlang/rebar3/projects/1, a few of the main features and fixes we have planned are:</p><p><br /></p><p>* Multi-repo support</p><p>** Host the packages you need and only hit the global hexpm when it isn't found in your internal repo</p><p>* Hex.pm organizations</p><p>** Support for hosting private packages on the official hexpm</p><p>* Performance improvements</p><p>** Parallel compilation of applications</p><p>* Streamline appup and relup creation</p><p>* Integrate changes and functionality upstream to OTP</p><p>* Regular bugfixing</p><p><img src=\"https://i.imgur.com/YW5kaBu.jpg\" /></p>",
    image: null,
    tags: null,
    deletedAt: null,
    fromCollective: {
      slug: "xdamman",
      name: "Xavier Damman",
      image: ""
    }
  }
};
data['user.monthlyreport'] = {
  recipient: { firstName: 'Xavier' },
  month: 'march', year: '2017',
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
        mission: 'We are on a mission to explore and develop new technologies for psychological, emotional and spiritual flourishing.',
        stats: {
          backers: {
            lastMonth: 11,
            new: 3,
            lost: 1,
          },
          balance: 1596 * 100,
          totalDonations: 82 * 100,
          totalExpenses: 25 * 100
        }
      }
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
        mission: 'We are on a mission to explore and develop new technologies for psychological, emotional and spiritual flourishing.',
        stats: {
          backers: {
            lastMonth: 11,
            new: 3,
            lost: 1,
          },
          balance: 1596 * 100,
          totalDonations: 82 * 100,
          totalExpenses: 25 * 100
        }
      }
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

const defaultData = {
  config: {
    host: {
      website: process.env.WEBSITE_URL || 'https://opencollective.com'
    }
  }
}

/*
 * Gets the body from a string (usually a template)
 */
const getTemplateAttributes = (str) => {
  let index = 0;
  const lines = str.split('\n');
  const attributes = {};
  let tokens;
  do {
    tokens = lines[index++].match(/^([a-z]+):(.+)/i);
    if (tokens) {
      attributes[tokens[1].toLowerCase()] = tokens[2].replace(/<br( \/)?>/g,'\n').trim();
    }
  } while (tokens);

  attributes.body = lines.slice(index).join('\n').trim();
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
  console.log("There is no mocked data defined for this template.");
  console.log("Please add mocked data by editing `scripts/compile-email.js`.");
} else {
  const juice = require('juice');
  const libEmailTemplates = require('../server/lib/emailTemplates');
  const template = libEmailTemplates[templateName];
  if (template) {
    const html = juice(template({ ...data[templateName], ...defaultData }));
    if (process.env.MAILGUN_PASSWORD) {
      const attributes = getTemplateAttributes(html);
      const mailgun = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: config.mailgun.user,
          pass: config.mailgun.password
        }
      });
      console.log(">>> Sending by email to ", process.env.EMAIL);
      mailgun.sendMail({ from: config.email.from, to: process.env.EMAIL, subject: attributes.subject, html: attributes.body }, (err, info) => {
        console.log("email sent");
      });
    }
    process.stdout.write(html);
  } else {
    console.log(`The email template "${templateName}" does not exist.`);
  }
}
