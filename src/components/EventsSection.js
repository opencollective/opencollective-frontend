
import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl'
import SectionTitle from './SectionTitle';
import EventsWithData from './EventsWithData';

class EventsSection extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired, // collective.id
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { collective, LoggedInUser } = this.props;
    let action;
    if (LoggedInUser && LoggedInUser.canEditCollective(collective)) {
      action = {
        href: `/${collective.slug}/events/new`,
        label: <FormattedMessage id="sections.events.new" defaultMessage="Create an Event" />
      }
    }

    return (
      <section id="events">
        <SectionTitle section="events" action={action} />
        <div className="eventsList">
          <EventsWithData collectiveSlug={collective.slug} />
        </div>
      </section>
    );
  }

}

export default withIntl(EventsSection);