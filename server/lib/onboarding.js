import emailLib from './email';
import { templateNames } from './emailTemplates';
import models, { Op } from '../models';
import Promise from 'bluebird';

const emailOptions = {
  from: 'Open Collective <support@opencollective.com>',
  type: 'onboarding',
};

export async function processCollective(collective, template) {
  console.log('-', collective.slug);
  const users = await collective.getAdminUsers();
  const unsubscribers = await models.Notification.getUnsubscribersUserIds('onboarding', collective.id);
  const recipients = users.filter(u => u && unsubscribers.indexOf(u.id) === -1).map(u => u.email);
  if (!recipients || recipients.length === 0) {
    return;
  }

  // if the collective is an open source one, we send the custom template if there is one.
  if ((collective.tags || []).includes('open source') && templateNames.includes(`${template}.opensource`)) {
    template = `${template}.opensource`;
  }

  // if the collective created is an ORGANIZATION, we only send an onboarding email if there is one specific to organizations
  if (collective.type === 'ORGANIZATION') {
    const orgTemplate = `${template}.${collective.type.toLowerCase()}`;
    if (templateNames.includes(orgTemplate)) {
      template = orgTemplate;
    } else {
      console.log(`${orgTemplate} template not found`);
      return;
    }
  }

  console.log(`>>> Sending ${template} email to the ${recipients.length} admin(s) of`, collective.slug);
  return Promise.map(recipients, recipient =>
    emailLib.send(template, recipient, { collective }, emailOptions).catch(e => {
      console.warn('Unable to send email to ', collective.slug, recipient, 'error:', e);
    }),
  );
}

export async function processOnBoardingTemplate(template, startsAt, filter = () => true) {
  const endsAt = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate() + 1);
  console.log(`\n>>> ${template} (from ${startsAt.toString()} to ${endsAt.toString()})`);

  return models.Collective.findAll({
    where: {
      type: { [Op.in]: ['ORGANIZATION', 'COLLECTIVE'] },
      isActive: true,
      createdAt: { [Op.gte]: startsAt, [Op.lt]: endsAt },
    },
  })
    .tap(collectives => console.log(`${template}> processing ${collectives.length} collectives`))
    .filter(filter)
    .tap(collectives => console.log(`${template}> processing ${collectives.length} collectives after filter`))
    .map(c => processCollective(c, template))
    .then(collectives => {
      console.log(`${collectives.length} collectives processed.`);
    })
    .catch(e => {
      console.log('>>> error caught', e);
    });
}
