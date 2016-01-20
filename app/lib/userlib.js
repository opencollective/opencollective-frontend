var config = require('config')
var clearbit = require('clearbit')(config.clearbit);

module.exports = {

  memory: {},

  clearbit: clearbit,

  fetchAvatar(user, cb) {
    if(!user || !user.email || !user.email.match(/@/)) {
      return cb(new Error("Invalid email"), user);
    }

    if(this.memory[user.email] !== undefined) {
      user.avatar = this.memory[user.email];
      return cb(null, user);
    }

    this.clearbit.Enrichment.find({email: user.email, stream: true})
      .then((res) => {
        user.avatar = res.person.avatar;
        this.memory[user.email] = user.avatar;
        return cb(null, user);
      })
      .catch(clearbit.Enrichment.NotFoundError, (err) => {
        this.memory[user.email] = null;
        return cb(new clearbit.Enrichment.NotFoundError(), user);
      })
      .catch((err) => {
        console.error('Clearbit error', err);
        return cb(err, user);
      });
  }
}