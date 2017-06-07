import withData from '../lib/withData'
import React from 'react'
import { addEventData } from '../graphql/queries';
import NotFound from '../components/NotFound';
import EditEvent from '../components/EditEvent';
import { IntlProvider, addLocaleData } from 'react-intl';

import 'intl';
import 'intl/locale-data/jsonp/en.js'; // for old browsers without window.Intl
import en from 'react-intl/locale-data/en';
import enUS from '../lang/en-US.json';
// import fr from 'react-intl/locale-data/fr';
// import es from 'react-intl/locale-data/es';
// import frFR from '../lang/fr-FR.json';

addLocaleData([...en]);
addLocaleData({
    locale: 'en-US',
    parentLocale: 'en',
});

class EditEventPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  render() {
    const { data } = this.props;

    if (!data.loading && !data.Event) {
      return (<NotFound />)
    }

    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <EditEvent event={data.Event} />
        </div>
      </IntlProvider>
    );
  }
}

export default withData(addEventData(EditEventPage));
