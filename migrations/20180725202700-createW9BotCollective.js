'use strict';

const insert = (sequelize, table, entry) => {
  if (!entry) {
    return console.error('Nothing to insert');
  }
  delete entry.id;
  for (var key in entry) {
    if (typeof entry[key] === 'object') {
      entry[key] = JSON.stringify(entry[key]);
    }
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

module.exports = {
  up: (queryInterface, sequelize) => {
    return queryInterface
      .changeColumn('Comments', 'CreatedByUserId', {
        type: sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        allowNull: true,
      })
      .then(() => {
        // Inserting OpenCollective Bot Collective
        const botData = {
          name: 'W9 bot',
          slug: 'w9bot',
          mission:
            'Help hosts by automating requesting users to submit their W9 or W8-BEN form when needed',
          description:
            'Help hosts by automating requesting users to submit their W9 or W8-BEN form when needed',
          longDescription:
            'Whenever someone files an expense to a host that has USD as its base currency, this bot will look at the sum of all past expenses of that user made during the year. If the sum exceeds $600, it will create a comment on the expense to ask to submit the W9, W8-BEN or W8-BEN-e form to the host',
          currency: 'USD',
          image: 'https://cldup.com/rdmBCmH20l.png',
          isActive: true,
          website: 'https://opencollective.com',
          type: 'BOT',
          settings: {
            W9: {
              threshold: 60000,
              comment:
                '<p>The total amount of the expenses that you have submitted ' +
                'this year to this host exceeds $600. To comply with the IRS, we need you to <a href="mailto:w9@opencollective.com?subject=W9%20for%20{{collective}}%20(hosted%20by%20{{host}})&body=Please%20find%20attached%20the%20[W9|W8-BEN|W8-BEN-E]%20form.%0D%0A%0D%0A-%20{{fromName}}%0D%0A%0D%0A---%0D%0A{{expenseUrl}}%0D%0ATotal%20amount%20expensed%20this%20year%20so%20far:%20{{totalAmountThisYear}}%0D%0A%0D%0A">send us by email</a> the' +
                ' <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf">W9 form</a> if you are a ' +
                'US resident (if you are not a US resident, please send the ' +
                '<a href="https://www.irs.gov/pub/irs-pdf/fw8ben.pdf">W-8BEN form</a> ' +
                'for individuals or the <a href="https://www.irs.gov/pub/irs-pdf/fw8bene.pdf">W-8BEN-E ' +
                'form</a> for companies) before we can proceed with this payment. ' +
                '<a href="https://github.com/opencollective/opencollective/wiki/Submitting-Expenses#taxes">' +
                'More info on our wiki</a>.</p>',
            },
          },
        };
        return insert(queryInterface.sequelize, 'Collectives', botData);
      });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  },
};
