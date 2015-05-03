// /**
//  * Dependencies.
//  */
// var expect    = require('chai').expect
//   , request   = require('supertest')
//   , _         = require('lodash')
//   , app       = require('../index')
//   , utils     = require('../test/utils.js')()
//   , config    = require('config')
//   ;
//
// /**
//  * Variables.
//  */
// var userData = utils.data('user1');
// var groupData = utils.data('group1');
// var models = app.set('models');
// var transactionsData = utils.data('transactions1').transactions;
//
// /**
//  * Tests.
//  */
// describe.skip('groups.transactions.routes.test.js', function() {
//
//   var group, user, application2;
//
//   beforeEach(function(done) {
//     utils.cleanAllDb(done);
//   });
//
//   // Create user.
//   beforeEach(function(done) {
//     models.User.create(utils.data('user1')).done(function(e, u) {
//       expect(e).to.not.exist;
//       user = u;
//       done();
//     });
//   });
//
//   // Create the group.
//   beforeEach(function(done) {
//     models.Group.create(groupData).done(function(e, g) {
//       expect(e).to.not.exist;
//       group = g;
//       done();
//     });
//   });
//
//   // Create an application which has only access to `group`
//   beforeEach(function(done) {
//     models.Application.create(utils.data('application2')).done(function(e, a) {
//       expect(e).to.not.exist;
//       application2 = a;
//       application2.addGroup(group).done(done);
//     });
//   });
//
//   // Create transactions into group.
//   beforeEach(function(done) {
//     async.eachSeries(transactionsData, function(t, cb) {
//     //   async.parallel([
//     //     function(cbParallel) {
//     //       models.Transaction.create(t).done(cb);
//     //     },
//     //     function(cbParallel) {
//     //       var a = {
//     //
//     //       }
//     //       models.Activity.create(a).done(cb);
//     //     },
//     //   ])
//     //   models.Activity.create(a).done(cb);
//     // }, done);
//   });
//
//   /**
//    * Get.
//    */
//   describe('#get a group with remaining budget', function() {
//
//     it('successfully get a group with left budget', function(done) {
//       request(app)
//         .get('/groups/' + group.id)
//         .send({
//           api_key: application2.api_key
//         })
//         .expect(200)
//         .end(function(e, res) {
//           expect(e).to.not.exist;
//         });
//     });
//
//   });
//
// });
