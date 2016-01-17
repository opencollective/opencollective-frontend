var clearbit = require('clearbit')('93890266fd5110a2f35ea61d31f484f7');

module.exports = {

  memory: {},

  clearbit: clearbit,
  
  fetchAvatar: function(user, cb) {
    if(!user || !user.email || !user.email.match(/@/)) {
      return cb(new Error("Invalid email"), user);
    }

    if(this.memory[user.email] !== undefined) {
      user.avatar = this.memory[user.email];
      return cb(null, user);
    }

    var self = this;

    this.clearbit.Enrichment.find({email: user.email, stream: true})
      .then(function(res) {
        user.avatar = res.person.avatar;
        self.memory[user.email] = user.avatar;
        return cb(null, user);
      })
      .catch(clearbit.Enrichment.NotFoundError, function(err) {
        self.memory[user.email] = null;
        return cb(new clearbit.Enrichment.NotFoundError(), user);
      })
      .catch(function(err) {
        console.error('Clearbit error', err);
        return cb(err, user);
      });
  }
}