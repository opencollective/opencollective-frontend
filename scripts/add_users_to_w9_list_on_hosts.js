/*
  Script to update the W9 data with users that have already received the request
  and sent the form(we are considering that once the expense is paid by the host
  it means that user has sent the form as requested)
  Find all expenses that have comments from w9 bot(Collective id 18665) and are paid,
  to then find the Users that created that expense and check if the collectives hosts
  have already included
*/

import models, { sequelize } from '../server/models';
import _, { get, set } from 'lodash';

const done = err => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

// look for a host data given an array of userIds that were supposed to be in
// both data.W9.requestSentToUserIds and data.W9.receivedFromUserIds
async function checkAndInsertUserIntoHostList(hostId, userIds) {
  const host = await models.Collective.findById(hostId);
  const requestSentToUserIds = get(host, 'data.W9.requestSentToUserIds', []);
  const receivedFromUserIds = get(host, 'data.W9.receivedFromUserIds', []);
  for (let i = 0; i < userIds.length; i++) {
    if (!requestSentToUserIds.includes(userIds[i])) {
      requestSentToUserIds.push(userIds[i]);
    }
    if (!receivedFromUserIds.includes(userIds[i])) {
      receivedFromUserIds.push(userIds[i]);
    }
  }
  set(host, 'data.W9.requestSentToUserIds', requestSentToUserIds);
  set(host, 'data.W9.receivedFromUserIds', receivedFromUserIds);
  host.update({ data: host.data });
}

function run() {
  return sequelize
    .query(
      `
  select host.id as "HostId", u.id as "UserId" from "Comments" c -- distinct(col."CreatedByUserId")
    left join "Expenses" e on c."ExpenseId"=e.id 
    left join "Users" u on e."UserId"=u.id
    left join "Collectives" col on c."CollectiveId"=col.id
    left join "Collectives" host on col."HostCollectiveId"=host.id
    where c."FromCollectiveId"=18665 and e.status='PAID';
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(async data => {
      const groupedByHostId = _.groupBy(data, 'HostId');

      for (let [key, value] of Object.entries(groupedByHostId)) {
        const uniqueUserIds = _.uniq(value.map(pair => pair.UserId));
        await checkAndInsertUserIntoHostList(key, uniqueUserIds);
      }
      return true;
    })
    .then(() => console.log('W9 Users list fixed... '))
    .then(done)
    .catch(done);
}

run();
