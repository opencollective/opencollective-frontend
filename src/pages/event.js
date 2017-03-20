import withData from '../lib/withData'
import React from 'react'
import Event from '../components/Event';
import { IntlProvider, addLocaleData } from 'react-intl';

import en from 'react-intl/locale-data/en';
import fr from 'react-intl/locale-data/fr';
import es from 'react-intl/locale-data/es';
import enUS from '../lang/en-US.json';
// import frFR from '../lang/fr-FR.json';

addLocaleData([...en, ...fr, ...es]);
addLocaleData({
    locale: 'en-US',
    parentLocale: 'en',
});

class EventPage extends React.Component {
  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }
  render() {
    const { collectiveSlug, eventSlug } = this.props;
    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <Event collectiveSlug={collectiveSlug} eventSlug={eventSlug} />
        </div>
      </IntlProvider>
    );
  }
}

export default withData(EventPage);
