
var expect = require('chai').expect;
var utils = require('../test/utils.js')();
var userlib = require('../app/lib/userlib.js');

/**
 * Variables.
 */
var userData = utils.data('user1');

describe("userlib", function() {
  
  it("can't fetch the avatar of an unknown email", function(done) {
    
    console.log("Calling fetchAvatar with ", userData);
    userlib.fetchAvatar(userData, function(err, user) {
      expect(err).to.exist;
      expect(userData.avatar).to.be.null;
      done();
    });
    
  });
  
});