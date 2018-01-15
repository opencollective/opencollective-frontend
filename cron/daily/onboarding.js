import Promise from 'bluebird';
import models from '../../server/models';
import emailLib from '../../server/lib/email';

let totalCollectives = 0, totalActives = 0;

const d = new Date;
const startsAt = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
const endsAt = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate() + 1);

console.log(">>> Fetching all new active collectives created between ", startsAt, endsAt);

models.Collective.findAll({
  where: {
    type: "COLLECTIVE",
    isActive: true,
    createdAt: { $gte: startsAt, $lt: endsAt }
  }
})
.tap(collectives => console.log(`>>> Processing ${collectives.length} collectives`))
.map(processCollective)
.then(() => {
  console.log(`${totalCollectives} collectives processed, ${totalActives} active.`)
  console.log(">>> all done");
  process.exit(0);
})
.catch(e => {
  console.log(">>> error caught", e);
});

async function processCollective(collective) {
  totalCollectives++;
  const users = await collective.getAdminUsers();
  const unsubscribers = await models.Notification.getUnsubscribers('onboarding', collective.id);
  const recipients = users.filter(u => u && unsubscribers.indexOf(u.id) === -1).map(u => u.email);
  console.log(`>>> Sending onboarding 30 days inactive email to the ${recipients.length} admin(s) of`, collective.slug);
  if (!recipients || recipients.length === 0) {
    return;
  }
  const options = {
    from: "Pia Mancini<pia@opencollective.com",
    type: "onboarding"
  }
  const numberOfTransactions = await models.Transaction.count({ where: { CollectiveId: collective.id }});
  let template;
  if (numberOfTransactions > 0) {
    totalActives++;
    template = "onboarding.30days.active";
    console.log(`${collective.slug} collective is active with ${numberOfTransactions} transactions, skipping.`);
    return; // skipping
  } else {
    template = "onboarding.30days.inactive";
  }
  return Promise.map(recipients, recipient => emailLib.send(template, recipient, { collective }, options).catch(e => {
    console.warn("Unable to send email to ", collective.slug, recipient, "error:", e);
  }));
}