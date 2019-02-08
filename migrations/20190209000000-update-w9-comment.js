'use strict';

import { set } from 'lodash';

module.exports = {
  up: (queryInterface, sequelize) => {
    // Look for current w9 collective settings to update only comment
    const botSlug = 'w9bot';
    return queryInterface.sequelize
      .query(`SELECT * FROM "Collectives" WHERE slug=:slug`, {
        type: sequelize.QueryTypes.SELECT,
        replacements: { slug: botSlug },
      })
      .then(res => {
        const collective = res[0];
        if (!collective) {
          throw new Error('W9 Bot Collective not found');
        }
        const settings = collective.settings;
        set(
          settings,
          'W9.comment',
          '<p>The total amount of the expenses that you have submitted ' +
            'this year to this host exceeds $600. To comply with the IRS, we need you to <a href="mailto:w9@opencollective.com?subject=W9%20for%20{{collective}}%20(hosted%20by%20{{host}})&body=Please%20find%20attached%20the%20[W9|W8-BEN|W8-BEN-E]%20form.%0D%0A%0D%0A-%20{{fromName}}%0D%0A%0D%0A---%0D%0A{{expenseUrl}}%0D%0ATotal%20amount%20expensed%20this%20year%20so%20far:%20{{totalAmountThisYear}}%0D%0A%0D%0A">send us by email</a> the' +
            ' <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf">W9 form</a> if you are a ' +
            'US person (a US citizen or US resident or a US incorporated entity) ' +
            'before we can proceed with this payment. If you are not a US person please send the ' +
            '<a href="https://www.irs.gov/pub/irs-pdf/fw8ben.pdf">W-8BEN</a> for individuals ' +
            'or the <a href="https://www.irs.gov/pub/irs-pdf/fw8bene.pdf">W-8BEN-E ' +
            'form</a> for companies. <a href="https://docs.opencollective.com">' +
            'See docs for more info</a>.</p>' +
            '<p>Note: if your expenses are reimbursements not invoices, please disregard this message.</p>',
        );

        return queryInterface.sequelize.query(`UPDATE "Collectives" SET settings=:settings WHERE slug=:slug`, {
          replacements: { settings: JSON.stringify(settings), slug: botSlug },
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  },
};
