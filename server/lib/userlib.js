var config = require('config')
var clearbit = require('clearbit')(config.clearbit);
var url = require('url');

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
  },

  resolveUserAvatars(userData, cb) {
    var name = userData.name;
    var email = userData.email;
    var website = userData.website;
    var twitterHandle = userData.twitterHandle;
    var linkedinUrl = userData.linkedinUrl;
    var facebookUrl = userData.facebookUrl;
    var ip = userData.ip;

    if(!email || !email.match(/.+@.+\..+/)) {
      return cb(new Error("Invalid email"));
    }

    if (website)
    {
      var parsedWebsiteUrl = url.parse(website);
      var hostname = parsedWebsiteUrl.hostname;
      if (/facebook.com$/.test(hostname))
      {
        facebookUrl = website;
      }
      else if (/linkedin.com\/pub|in|profile/.test(hostname))
      {
        linkedinUrl = website;
      }
    }

    this.clearbit.Enrichment.find({
      email: email, 
      given_name: name, 
      ip_address: ip,
      linkedin: linkedinUrl,
      facebook: facebookUrl,
      twitter: twitterHandle,
      stream: true
    })
    .then((res) => {  
      var person = res.person;
      var company = res.company;
      var sources = [];

      if (person)
      {
        const personAvatarSources = ['twitter', 'aboutme', 'gravatar', 'github'];
        personAvatarSources.forEach((source) => {
          if (person[source] && person[source].avatar)
          {
            sources.push({src: person[source].avatar, source: source});
          }
        });
        if (person.avatar)
        {
          sources.push({src: person.avatar, source: 'clearbit'});
        }
      }
      
      if (company)
      {
        const companyAvatarSources = ['twitter', 'angellist'];
        companyAvatarSources.forEach((source) => {
          if (company[source] && company[source].avatar)
          {
            sources.push({src: company[source].avatar, source: source});
          }
        });
        if (company.logo)
        {
          sources.push({src: company.logo, source: 'clearbit'});
        }
      }

      return cb(null, sources);
    })
    .catch(clearbit.Enrichment.NotFoundError, () => {
      return cb(new clearbit.Enrichment.NotFoundError());
    })
    .catch((err) => {
      console.error('Clearbit error', err);
      return cb(err);
    });
  }
}