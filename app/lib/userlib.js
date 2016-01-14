var clearbit = require('clearbit')('93890266fd5110a2f35ea61d31f484f7');

module.exports = {
  
  fetchAvatar: function(user, cb) {
    if(!user || !user.email || !user.email.match(/@/)) {
      return cb(new Error("Invalid email"), user);
    }
    
    clearbit.Enrichment
      .find({email: user.email, stream: true})
      .then(function (person) {
        console.log(person);
        user.avatar = person.avatar
        cb(null, user);
      })
      .catch(clearbit.Enrichment.NotFoundError, function (err) {
        // Email address could not be found
        console.log(err);
        cb(err, user);
      })
      .catch(function (err) {
        console.error(err);
        cb(err, user);
      });
  }
  
}