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
      name: 'Open Collective bot',
      mission: 'Support users through the platform',
      description: 'Open Collective bot that support users through the platform',
      longDescription: 'Open Collective bot that support users through the platform',
      currency: 'USD',
      image: 'https://cldup.com/rdmBCmH20l.png',
      isActive: true,
      slug: 'opencollective-company',
      website: 'https://opencollective.com',
      type: 'BOT'
    };
    return insert(queryInterface.sequelize, "Collectives", botData);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve(); 
  }
};
