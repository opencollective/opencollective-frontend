/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');
  const errors = app.errors;
  const queries = require('../lib/queries')(app);

  return (req, res, next) => {
    const getGroupsByTag = (tag) => {
      return models.Group.findAll({
        where: {
          tags: { $contains: [tag] }
        },
        limit: 6
      })
    };

    Promise.all([
      queries.getTotalCollectives(), 
      queries.getTotalDonors(), 
      queries.getTotalDonations(),
      getGroupsByTag('open source'),
      getGroupsByTag('meetup')
    ])
    .then(r => {
      const hp = {
        stats: {
          totalCollectives: r[0].totalCollectives,
          totalDonors: r[1].totalDonors,
          totalDonations: Math.round(r[2].totalDonationsInUSD)
        },
        collectives: {
          opensource: r[3],
          meetup: r[4]
        }
      }
      res.send(hp);
    })
    .catch(next);
  }
};