var config = require('config')
var clearbit = require('clearbit')(config.clearbit);

module.exports = {

  memory: {},

  clearbit: clearbit,

  fetchInfo(user, cb) {
    this.getUserData(user.email, (err, userData) => {
      if(userData) {
        user.name = user.name || userData.name.fullName;
        user.avatar = user.avatar || userData.avatar;
        user.twitterHandle = user.twitterHandle || userData.twitter.handle;
        user.website = user.website || userData.site;
      }
      cb(err, user);
    });
  },

  fetchAvatar(user, cb) {
    if(user.avatar) return cb(null, user);

    this.getUserData(user.email, (err, userData) => {
      if(userData) {
        user.avatar = userData.avatar;
      }
      cb(err, user);
    });
  },

  getUserData(email, cb) {
    if(!email || !email.match(/.+@.+\..+/)) {
      return cb(new Error("Invalid email"));
    }

    if(this.memory[email] !== undefined) {
      return cb(null, this.memory[email]);
    }

    this.clearbit.Enrichment.find({email: email, stream: true})
      .then((res) => {
        this.memory[email] = res.person;
        return cb(null, res.person);
      })
      .catch(clearbit.Enrichment.NotFoundError, () => {
        this.memory[email] = null;
        return cb(new clearbit.Enrichment.NotFoundError());
      })
      .catch((err) => {
        console.error('Clearbit error', err);
        return cb(err);
      });
  }
}