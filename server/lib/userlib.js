import Promise from 'bluebird';
import debug from 'debug';
import config from 'config';

import clearbit from './clearbit';

const debugClearbit = debug('clearbit');

export default {
  memory: {},

  clearbit,

  getUserData(email) {
    if (!config.clearbit || !config.clearbit.key) {
      return Promise.resolve();
    }

    if (!email || !email.match(/.+@.+\..+/)) {
      return Promise.resolve();
    }

    if (this.memory[email] !== undefined) {
      return Promise.resolve(this.memory[email]);
    }

    return this.clearbit.Enrichment.find({ email, stream: true })
      .tap(res => (this.memory[email] = res.person))
      .then(res => res.person)
      .catch(clearbit.Enrichment.NotFoundError, () => (this.memory[email] = null))
      .catch(err => debugClearbit('Clearbit error', err));
  },

  /*
   * Extract username from github image url
   * Needed to get usernames for github signups
   */
  getUsernameFromGithubURL(url) {
    const githubUrl = 'avatars.githubusercontent.com/';
    if (url && url.indexOf(githubUrl) !== -1) {
      const tokens = url.split(githubUrl);
      if (tokens.length === 2 && tokens[1] !== '') {
        return tokens[1];
      }
    }
    return null;
  },

  updateUserInfoFromClearbit(user) {
    // don't try to fetch user details if user hasn't provided a first name (i.e. if they wanted to remain incognito)
    if (!user.email || !user.firstName) {
      return Promise.resolve();
    }
    return this.getUserData(user.email).then(userData => {
      if (userData) {
        user.firstName = user.firstName || userData.name.givenName;
        user.lastName = user.lastName || userData.name.familyName;
        // TODO: user.image/twitterhandle/website no longer exists. Update this to attach the image to User Collective
        // user.image = user.image || userData.image;
        // user.twitterHandle = user.twitterHandle || userData.twitter.handle;
        // user.website = user.website || userData.site;
        return user.save();
      } else {
        return Promise.resolve();
      }
    });
  },
};
