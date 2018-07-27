'use strict';

const insert = (sequelize, table, entry) => {
  return sequelize.query(`
    INSERT INTO "${table}" ("${Object.keys(entry).join('","')}") VALUES (:${Object.keys(entry).join(",:")})
  `, { replacements: entry });
};

module.exports = {
  up: (queryInterface, sequelize) => {
    
    // Inserting OpenCollective Bot Collective
    const botData = {
      name: 'IRS Bot',
      mission: 'Support users through the platform',
      description: 'IRS bot that support users regarding IRS issues through the platform',
      longDescription: 'IRS bot that support users regarding IRS issues  through the platform',
      currency: 'USD',
      image: 'https://cldup.com/rdmBCmH20l.png',
      isActive: true,
      slug: 'irs-bot',
      website: 'https://opencollective.com',
      type: 'BOT',
      settings: JSON.stringify({
        thresholdW9: 60000,
        thresholdW9HtmlComment: '<p>You have now been paid $600 or more through Open Collective, which' +
          ' means we need to ask you fill out a tax form. For more info,' +
          ' <a href="https://github.com/opencollective/opencollective/wiki/Submitting-Expenses#taxes">' +
          'click here see the help wiki.</a></p>'
      })
    };
    return insert(queryInterface.sequelize, "Collectives", botData);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); 
  }
};
