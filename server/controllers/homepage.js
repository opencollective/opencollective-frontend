/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');
  const queries = require('../lib/queries')(app);

  return (req, res, next) => {
    const getGroupsByTag = (tag) => {
      return models.Group.findAll({
        where: {
          isPublic: true,
          tags: { $contains: [tag] }
        },
        order: [['updatedAt', 'DESC']],
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
          totalCollectives: r[0],
          totalDonors: r[1],
          totalDonations: r[2]
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