import filter from 'lodash/collection/filter';
import values from 'lodash/object/values';
import errors from '../lib/errors';
import requestPromise from 'request-promise';

class Meetup {

  constructor(meetupAccount, collective) {
    if (!meetupAccount || !meetupAccount.secret)
      return Promise.reject(new errors.ValidationFailed("This collective doesn't have a meetup.com account connected"));

    this.collective = collective;
    this.settings = {
      api_key: meetupAccount.secret,
      slug: meetupAccount.username
    };
  }

  /**
   * We show the 5 top sponsors (if any)
   * Otherwise we show the 10 top backers
   */
  makeHeader() {
    let header = '', usersList = '', tier = {};
    const users = values(this.collective.users);

    // Order backers by totalDonations DESC
    users.sort((a, b) => b.totalDonations - a.totalDonations);

    const sponsors = filter(users, { tier: 'sponsor' }).slice(0, 5); // max 5 sponsors
    const backers = users.slice(0, 10); // or max 10 backers

    if (sponsors.length > 0) {
      tier = { name: 'sponsor', users: sponsors };
    } else {
      tier = { name: 'backer', users: backers };
    }

    if (tier.users.length > 0) {
      usersList = tier.users.map((user) => (user.website) ? `<a href="${user.website}">${user.name}</a>` : user.name).join(', ');
      usersList = usersList.replace(/,([^,]*)$/,' and$1');
      header += `<p>Thank you to our ${tier.name}s ${usersList}</p> `;
    }

    header += `<p><a href="https://opencollective.com/${this.collective.slug}#${tier.name}s"><img src="https://opencollective.com/${this.collective.slug}/${tier.name}s.png?width=700"></a></p>`;

    return header;
  }

  updateMeetupDescription(eventId, description) {
    return requestPromise({
      url: `http://api.meetup.com/2/event/${eventId}?key=${this.settings.api_key}`,
      method: 'post',
      form: { description },
      json: true
    });
  }

  generateNewDescription(action, description) {
    const descriptionHeader = this.makeHeader();
    const regex = new RegExp(`<p><a href="https://opencollective.com/`);
    let newDescription = null;
    switch (action) {
      case 'addHeader':
        if (!description.match(regex)) {
          newDescription = `${descriptionHeader} ${description}`;
        }
        break;
      case 'removeHeader':
        if (description.match(regex)) {
          const paragraphs = description.split('</p> <p>');
          // If there were no backers, we only have one paragraph to remove
          const numberOfParagraphsToSkip = ( paragraphs[1].substr(0,36) === `<a href="https://opencollective.com/`) ? 2 : 1;
          newDescription = `<p>${paragraphs.slice(numberOfParagraphsToSkip).join('</p> <p>')}`;
        }
        break;
    }
    return newDescription;
  }

  syncCollective(action = 'addHeader') {

    if (!this.settings.api_key)
      return Promise.reject(new errors.ValidationFailed("This collective doesn't have a meetup.com account connected"));

    const urlname = this.settings.slug;

    const reqopt = {
      url: `http://api.meetup.com/${urlname}/events?key=${this.settings.api_key}`,
      json: true
    };

    const promises = [];
    return requestPromise(reqopt)
      .then(meetups => {
        for (let i=0;i<meetups.length;i++) {
          const meetup = meetups[i];
          const newDescription = this.generateNewDescription(action, meetup.description);
          if (newDescription)
            promises.push(this.updateMeetupDescription(meetup.id, newDescription));
        }
        return Promise.all(promises);
      })
      .catch(e => {
        const error = (e.error && e.error.errors && e.error.errors.length > 0) ? e.error.errors[0].message : e.message || e;
        return Promise.reject(new errors.BadRequest(error));
      });

  }

}

export default Meetup;