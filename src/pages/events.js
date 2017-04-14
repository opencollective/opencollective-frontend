import React from 'react';
import { addEventsData } from '../graphql/queries';
import Link from 'next/link';
import withData from '../lib/withData';
import { IntlProvider, addLocaleData } from 'react-intl';
import { FormattedDate } from 'react-intl';

import 'intl';
import 'intl/locale-data/jsonp/en.js'; // for old browsers without window.Intl
import en from 'react-intl/locale-data/en';
import enUS from '../lang/en-US.json';

addLocaleData([...en]);
addLocaleData({
    locale: 'en-US',
    parentLocale: 'en',
});

class Events extends React.Component {

  getInitialProps() {
    // forces server side rendering
  }

  render() {
    const { loading, allEvents } = this.props.data;

    console.log("data", this.props.data);
    if (loading) return (<div />);
    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <ul>
        {allEvents.map(event => 
          <li key={event.id}>
            <Link href={{path: `/events`, query: { collectiveSlug: event.collective.slug, eventSlug: event.slug}}} as={`/${event.collective.slug}/events/${event.slug}`}>{event.name}</Link>, &nbsp;
            <FormattedDate value={event.startsAt} day='numeric' month='long' />
          </li>)
        }
        </ul>
      </IntlProvider>
    );
  }

}

export default withData(addEventsData(Events));