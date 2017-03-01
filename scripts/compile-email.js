const templateName =  process.argv[2];
const templateData = {
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
      group: {
        publicUrl: 'cycle.js.org',
        name: 'Between the Wires',
        slug: 'cyclejs',
        logo: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
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
      group: {
        publicUrl: 'cycle.js.org',
        name: 'Between the Wires',
        slug: 'cyclejs',
        logo: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
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
  relatedGroups: [
    {
      currency: 'USD',
      logo: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
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
      logo: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
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
      logo: 'http://opencollective.com/proxy/images/?src=https%3A%2F%2Fcldup.com%2F1Hzq0cyqgW.png&height=320',
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

if (!templateName) {
  console.log('\nCompiles a registered email template to stdout.\n');
  console.log('Usage: npm run compile:email <name>\n');
  console.log('Where <name> is the name of a template found in:');
  console.log('./server/lib/emailTemplates\n');
  console.log('  Example 1: npm run -s compile:email backer.monthlyreport\n');
  console.log('  Example 2: npm run -s comple:email email.approve > email-approve.html\n');
  console.log('Note: `-s` switch is requried to suppress warnings from npm.');
  console.log('Note: Edit the script to specify the data that is passed to the template.');
} else {
  const juice = require('juice');
  const libEmailTemplates = require('../server/lib/emailTemplates');
  const template = libEmailTemplates[templateName];
  if (template) {
    process.stdout.write(juice(template(templateData)));
  } else {
    console.log(`The email template "${templateName}" does not exist.`);
  }
}
