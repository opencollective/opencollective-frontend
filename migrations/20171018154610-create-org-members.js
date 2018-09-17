'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

let orgsFound = 0;
const orgsProcessed = [];
const orgsChanged = [];
const orgsUnchanged = [];
const orgsFoundWithoutMember = [];

const insert = (sequelize, table, entry) => {
  delete entry.id;
  console.log(
    `INSERT INTO "${table}" ("${Object.keys(entry).join(
      '","',
    )}") VALUES (:${Object.values(entry).join(',:')})`,
  );
  if (entry.data) {
    entry.data = JSON.stringify(entry.data);
  }
  return sequelize.query(
    `
    INSERT INTO "${table}" ("${Object.keys(entry).join(
      '","',
    )}") VALUES (:${Object.keys(entry).join(',:')})
  `,
    { replacements: entry },
  );
};

const updateOrgMembers = sequelize => {
  // find all collectives that are ORGANIZATIONS
  return (
    sequelize
      .query(
        `
    SELECT * FROM "Collectives" 
    WHERE type LIKE 'ORGANIZATION'
    ORDER BY id
    `,
        { type: sequelize.QueryTypes.SELECT },
      )

      // For each one:
      /*
      1. List out all the Members of that Org (mostly for testing)
      2. If there is a User account referencing that collective, move that User
         to Members table as ADMIN. 
      3. Remove shortcut from Users table for that collective
    */
      .each(collective => {
        let userCollective, membersFound;
        orgsFound++;
        orgsProcessed.push(collective);

        // STEP 1: list out all the members of this org
        return (
          sequelize
            .query(
              `
        SELECT * FROM "Members" m
        LEFT JOIN "Collectives" c on m."MemberCollectiveId" = c.id 
        WHERE m."CollectiveId" = :collectiveId and m."deletedAt" IS NULL;
        `,
              {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                  collectiveId: collective.id,
                },
              },
            )
            .then(members => {
              membersFound = members.length;
              console.log('\n\n>>> Collective: ', collective.slug);
              console.log('>>> members found', members.length);
            })

            // STEP 2: find any User account referencing this collective directly
            .then(() =>
              sequelize.query(
                `
          SELECT * FROM "Users" 
          WHERE "CollectiveId" = :collectiveId
          `,
                {
                  type: sequelize.QueryTypes.SELECT,
                  replacements: {
                    collectiveId: collective.id,
                  },
                },
              ),
            )

            .then(users => {
              // If User account found:
              if (users.length === 1) {
                orgsChanged.push(collective);
                const user = users[0];
                console.log('>>> User found: ', user.id);

                // Create a new collective for that User
                let name = user.firstName;
                if (name && user.lastName) {
                  name += ` ${user.lastName}`;
                }
                const userCollectiveInfo = {
                  type: 'USER',
                  name: name || (user.email && user.email.split(/@|\+/)[0]),
                  image: user.image,
                  mission: user.mission,
                  description: user.description,
                  longDescription: user.longDescription,
                  website: user.website,
                  twitterHandle: user.twitterHandle,
                  isActive: true,
                  CreatedByUserId: user.id,
                  data: { UserId: user.id },
                };
                return (
                  insert(
                    sequelize,
                    'Collectives',
                    _.pick(userCollectiveInfo, _.identity),
                  )
                    // now find that collective (we'll need it later)
                    .then(() =>
                      sequelize.query(
                        `
                SELECT * FROM "Collectives"
                WHERE "CreatedByUserId" = :createdByUserId
                ORDER BY id DESC
                LIMIT 1
                `,
                        {
                          type: sequelize.QueryTypes.SELECT,
                          replacements: {
                            createdByUserId: user.id,
                          },
                        },
                      ),
                    )
                    .then(uCollective => {
                      userCollective = uCollective[0];
                    })

                    // remove shortcut from Users table
                    .then(() =>
                      sequelize.query(
                        `
                UPDATE "Users" SET "CollectiveId" = :userCollectiveId 
                WHERE id = :userId;
                `,
                        {
                          replacements: {
                            userCollectiveId: userCollective.id,
                            userId: user.id,
                          },
                        },
                      ),
                    )

                    // add that collective as a member of the org
                    .then(() => {
                      const memberRow = {
                        CreatedByUserId: user.id,
                        CollectiveId: collective.id,
                        role: 'ADMIN',
                        MemberCollectiveId: userCollective.id,
                      };
                      return insert(sequelize, 'Members', memberRow);
                    })
                );
              } else {
                orgsUnchanged.push(collective);
                if (membersFound === 0) {
                  orgsFoundWithoutMember.push(collective);
                }
                return Promise.resolve();
              }
            })
        );
      })
  );
};

module.exports = {
  up: (queryInterface, DataTypes) => {
    // now process each org and make sure Members table is correct
    return updateOrgMembers(queryInterface.sequelize).then(() => {
      console.log('>>> ', orgsFound, 'orgs found');
      console.log('>>> ', orgsProcessed.length, 'orgs processed');
      console.log('>>> ', orgsChanged.length, 'orgs changed');
      console.log('>>> ', orgsUnchanged.length, 'orgs unchanged');
      console.log(
        '>>> ',
        orgsFoundWithoutMember.length,
        'orgs found without member',
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
