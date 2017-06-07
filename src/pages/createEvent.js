import withData from '../lib/withData'
import React from 'react'
import CreateEvent from '../components/CreateEvent';
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

class CreateEventPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  render() {

    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <CreateEvent collectiveSlug={this.props.collectiveSlug} />
        </div>
      </IntlProvider>
    );
  }
}

export default withData(CreateEventPage);
