import filter from 'lodash/collection/filter';
import values from 'lodash/object/values';
import errors from '../lib/errors';
import requestPromise from 'request-promise';

class Meetup {

  constructor(meetupAccount, group) {
    if (!meetupAccount || !meetupAccount.secret)
      return Promise.reject(new errors.ValidationFailed("url or api_key for meetup.com missing in the group's settings"));

    this.group = group;
    this.settings = {
      api_key: meetupAccount.secret,
      slug: meetupAccount.username
    };
  }

  makeHeadersForTier(tiername) {
    let header = '', usersList = '';

    const usersInTier = filter(values(this.group.users), { tier: tiername });

    if (usersInTier.length > 0) {
      usersList = usersInTier.map((user) => (user.website) ? `<a href="${user.website}">${user.name}</a>` : user.name).join(', ');
      usersList = usersList.replace(/,([^,]*)$/,' and$1');
      header += `<p>Thank you to our sponsors ${usersList}</p>\n`;
    }

    header += `<p><a href="https://opencollective.com/${this.group.slug}"><img src="https://opencollective.com/${this.group.slug}/${tiername}s.png?width=700"></a></p>`;

    return header;
  };

  updateMeetupDescription(eventId, description) {
    return requestPromise({
      url: `http://api.meetup.com/2/event/${eventId}?key=${this.settings.api_key}`,
      method: 'post',
      form: { description },
      json: true
    });
  }

  syncCollective() {

    if (!this.settings.api_key)
      return Promise.reject(new errors.ValidationFailed("url or api_key for meetup.com missing in the group's settings"));

    const urlname = this.settings.slug;

    const reqopt = {
      url: `http://api.meetup.com/${urlname}/events?key=${this.settings.api_key}`,
      json: true
    };

    const descriptionHeader = this.makeHeadersForTier('sponsor');

    const promises = [];
    return requestPromise(reqopt)
      .then(meetups => {
        for (let i=0;i<meetups.length;i++) {
          const meetup = meetups[i];
          if (!meetup.description.match(new RegExp(`^${descriptionHeader.substr(0, 50)}`))) {
            promises.push(this.updateMeetupDescription(meetup.id, `${descriptionHeader}\n ${meetup.description}`));
          }
        }
        return Promise.all(promises);
      })
      .catch(e => {
        const error = (e.error && e.error.errors && e.error.errors.length > 0) ? e.error.errors[0].message : e;
        return Promise.reject(new errors.ValidationFailed(error));
      });

  };

};

export default Meetup;