import Promise from 'bluebird';
import models from '../../server/models';
import emailLib from '../../server/lib/email';
import { get } from 'lodash';

let totalCollectives = 0;

const emailOptions = {
  from: "Pia Mancini<pia@opencollective.com",
  type: "onboarding"
}

const XDaysAgo = (days) => {
  const d = new Date;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - days);
}

Date.prototype.toString = function() {
  const mm = this.getMonth() + 1; // getMonth() is zero-based
  const dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
};

const onlyInactiveCollectives = (collective) => {
  return models.Transaction.count({ where: { CollectiveId: collective.id }}).then(count => count === 0);
}

const onlyCollectivesWithoutExpenses = (collective) => {
  return models.Expense.count({ where: { CollectiveId: collective.id }}).then(count => count === 0);
}

const onlyCollectivesWithoutTwitterActivated = (collective) => {
  return models.ConnectedAccount.findOne({ where: { CollectiveId: collective.id, service: 'twitter' }})
    .then(twitterAccount => {
      if (!twitterAccount) return true;
      if (get(twitterAccount, 'settings.monthlyStats.active') && get(twitterAccount, 'settings.newBacker.active')) return false;
      return true;
    });
}

Promise.all([
  processOnBoardingTemplate("onboarding.day35.inactive", XDaysAgo(35), onlyInactiveCollectives),
  processOnBoardingTemplate("onboarding.day28", XDaysAgo(28)),
  processOnBoardingTemplate("onboarding.day21.noTwitter", XDaysAgo(21), onlyCollectivesWithoutTwitterActivated),
  processOnBoardingTemplate("onboarding.day14.noExpenses", XDaysAgo(14), onlyCollectivesWithoutExpenses),
  processOnBoardingTemplate("onboarding.day7.widgets", XDaysAgo(7)),
  processOnBoardingTemplate("onboarding.day2", XDaysAgo(2))
]).then(() => {
  console.log(">>> all done");
  process.exit(0);
});

async function processOnBoardingTemplate(template, startsAt, filter = () => true) {

  const endsAt = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate() + 1);
  console.log(`\n>>> ${template} (from ${startsAt.toString()} to ${endsAt.toString()})`);
  
  return models.Collective.findAll({
    where: {
      type: "COLLECTIVE",
      isActive: true,
      createdAt: { $gte: startsAt, $lt: endsAt }
    }
  })
  .tap(collectives => console.log(`${template}> processing ${collectives.length} collectives`))
  .filter(filter)
  .tap(collectives => console.log(`${template}> processing ${collectives.length} collectives after filter`))
  .map(c => processCollective(c, template))
  .then(() => {
    console.log(`${totalCollectives} collectives processed.`)
  })
  .catch(e => {
    console.log(">>> error caught", e);
  });

}

async function processCollective(collective, template) {
  totalCollectives++;
  console.log("-", collective.slug);
  const users = await collective.getAdminUsers();
  const unsubscribers = await models.Notification.getUnsubscribersUserIds('onboarding', collective.id);
  const recipients = users.filter(u => u && unsubscribers.indexOf(u.id) === -1).map(u => u.email);
  if (!recipients || recipients.length === 0) {
    return;
  }
  console.log(`>>> Sending ${template} email to the ${recipients.length} admin(s) of`, collective.slug);
  return Promise.map(recipients, recipient => emailLib.send(template, recipient, { collective }, emailOptions).catch(e => {
    console.warn("Unable to send email to ", collective.slug, recipient, "error:", e);
  }));
}