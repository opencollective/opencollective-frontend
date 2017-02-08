import url from 'url';
import Promise from 'bluebird';
import slug from 'slug';
import clearbit from '../gateways/clearbit';
import { sequelize } from '../models';

export default {

  memory: {},

  clearbit,

  fetchAvatar(email) {
    return this.getUserData(email)
      .then(userData => userData && userData.avatar ? userData.avatar : null)
  },

  getUserData(email) {
    if (!email || !email.match(/.+@.+\..+/)) {
      return Promise.resolve();
    }

    if (this.memory[email] !== undefined) {
      return Promise.resolve(this.memory[email]);
    }

    return this.clearbit.Enrichment.find({email, stream: true})
      .tap(res => this.memory[email] = res.person)
      .then(res => res.person)
      .catch(clearbit.Enrichment.NotFoundError, () => this.memory[email] = null)
      .catch(err => console.error('Clearbit error', err));
  },

  resolveUserAvatars(userData, cb) {
    const { name } = userData;
    const { email } = userData;
    const { website } = userData;
    const { twitterHandle } = userData;
    let { linkedinUrl } = userData;
    let { facebookUrl } = userData;
    const { ip } = userData;

    if (!email || !email.match(/.+@.+\..+/)) {
      return cb(new Error("Invalid email"));
    }

    if (website) {
      const parsedWebsiteUrl = url.parse(website);
      const { hostname } = parsedWebsiteUrl;
      if (/facebook.com$/.test(hostname)) {
        facebookUrl = website;
      } else if (/linkedin.com\/pub|in|profile/.test(hostname)) {
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
      const { person } = res;
      const { company } = res;
      const sources = [];

      if (person) {
        const personAvatarSources = ['twitter', 'aboutme', 'gravatar', 'github'];
        personAvatarSources.forEach((source) => {
          if (person[source] && person[source].avatar) {
            sources.push({src: person[source].avatar, source});
          }
        });
        if (person.avatar) {
          sources.push({src: person.avatar, source: 'clearbit'});
        }
      }

      if (company) {
        const companyAvatarSources = ['twitter', 'angellist'];
        companyAvatarSources.forEach((source) => {
          if (company[source] && company[source].avatar) {
            sources.push({src: company[source].avatar, source});
          }
        });
        if (company.logo) {
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
  },

  /*
   * If there is a username suggested, we'll check that it's valid or increase it's count
   * Otherwise, we'll suggest something.
   */

  suggestUsername(user) {
    // generate potential usernames
    const potentialUserNames = [
      user.username,
      user.suggestedUsername,
      user.avatar ? this.getUsernameFromGithubURL(user.avatar) : null,
      user.twitterHandle ? user.twitterHandle.replace(/@/g, '') : null,
      user.name ? user.name.replace(/ /g, '') : null,
      user.email ? user.email.split(/@|\+/)[0] : null]
      .filter(username => username ? true : false) // filter out any nulls
      .map(username => slug(username).toLowerCase(/\./g,'')) // lowercase them all
      // remove any '+' signs
      .map(username => username.indexOf('+') !== -1 ? username.substr(0, username.indexOf('+')) : username);

    // In theory, this should never happen because we already have an email
    // TODO: add a random username to make sure that every user has a username
    if (potentialUserNames.length === 0) {
      console.error(`No potential username found for user: ${user.email}`);
      return Promise.resolve()
    }

    // fetch any matching usernames or slugs for the top choice in the list above
    return sequelize.query(`
        SELECT username as username FROM "Users" where username like '${potentialUserNames[0]}%'
        UNION ALL
        SELECT slug as username FROM "Groups" where slug like '${potentialUserNames[0]}%'
      `, {
        type: sequelize.QueryTypes.SELECT
      })
    .then(userObjectList => userObjectList.map(user => user.username))
    .then(usernameList => this.usernameSuggestionHelper(potentialUserNames[0], usernameList, 0));
  },

  /*
   * Checks a given username in a list and if found, increments count and recursively checks again
   */
  usernameSuggestionHelper(usernameToCheck, usernameList, count) {
    const username = count > 0 ? `${usernameToCheck}${count}` : usernameToCheck;
    if (usernameList.indexOf(username) === -1) {
      return username;
    } else {
      return this.usernameSuggestionHelper(`${usernameToCheck}`, usernameList, count+1);
    }
  },

  /*
   * Extract username from github avatar url
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
    if (!user.email) {
      return Promise.resolve();
    } 
    return this.getUserData(user.email)
      .then(userData => {
        if (userData) {
          user.firstName = user.firstName || userData.name.givenName;
          user.lastName = user.lastName || userData.name.familyName;
          user.avatar = user.avatar || userData.avatar;
          user.twitterHandle = user.twitterHandle || userData.twitter.handle;
          user.website = user.website || userData.site;
          return user.save();
        } else {
          return Promise.resolve();
        }
      });
  }
};
