var config = require('config');
var clearbit = require('clearbit')(config.clearbit);
var url = require('url');
const Promise = require('bluebird');

module.exports = {

  memory: {},

  clearbit,

  fetchInfo(user) {
    return this.getUserData(user.email)
      .then(userData => {
        if (userData) {
          user.name = user.name || userData.name.fullName;
          user.avatar = user.avatar || userData.avatar;
          user.twitterHandle = user.twitterHandle || userData.twitter.handle;
          user.website = user.website || userData.site;
        }
        return user;
      });
  },

  fetchAvatar(user) {
    if(user.avatar) {
      return Promise.resolve(user);
    }
    return this.getUserData(user.email)
      .tap(userData => user.avatar = userData && userData.avatar)
      .then(() => user);
  },

  getUserData(email) {
    if(!email || !email.match(/.+@.+\..+/)) {
      return Promise.resolve();
    }

    if(this.memory[email] !== undefined) {
      return Promise.resolve(this.memory[email]);
    }

    return this.clearbit.Enrichment.find({email: email, stream: true})
      .tap(res => this.memory[email] = res.person)
      .then(res => res.person)
      .catch(clearbit.Enrichment.NotFoundError, () => this.memory[email] = null)
      .catch(err => console.error('Clearbit error', err));
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

    if (website) {
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
      email,
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
};
