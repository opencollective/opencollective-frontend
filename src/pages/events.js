import React from 'react';
import { addEventsData } from '../graphql/queries';
import Link from 'next/link';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import { FormattedDate, FormattedMessage } from 'react-intl';

class Events extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  renderEventEntry(event) {
    return (<li key={event.id}>
              <Link href={{path: `/events`, query: { collectiveSlug: event.collective.slug, eventSlug: event.slug}}} as={`/${event.collective.slug}/events/${event.slug}`}>{event.name}</Link>, &nbsp;
              <FormattedDate value={event.startsAt} day='numeric' month='long' />
            </li>);    
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading) return (<div />);

    const now = new Date, pastEvents = [], futureEvents = [];
    allEvents.map(event => {
      if (new Date(event.startsAt) > now)
        futureEvents.push(event);
      else
        pastEvents.push(event);
    })
    pastEvents.reverse();

    return (
      <div>
        <h2><FormattedMessage id='events.title.futureEvents' values={{n: futureEvents.length}} defaultMessage={`Next {n, plural, one {event} other {events}}`} /></h2>
        <ul>
        {futureEvents.map(this.renderEventEntry)}
        </ul>
        <h2><FormattedMessage id='events.title.pastEvents' values={{n: pastEvents.length}} defaultMessage={`Past {n, plural, one {event} other {events}}`} /></h2>
        <ul>
        {pastEvents.map(this.renderEventEntry)}
        </ul>
      </div>
    );
  }

}

export default withData(withIntl(addEventsData(Events)));