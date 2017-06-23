import withData from '../lib/withData'
import React from 'react'
import { addEventData, addGetLoggedInUserFunction } from '../graphql/queries';
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

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  async componentDidMount() {
    setTimeout(async () => {
    const res = await this.props.getLoggedInUser();
    const LoggedInUser = res.data.LoggedInUser;
    const membership = LoggedInUser.collectives.find(c => c.slug === this.props.collectiveSlug);
    LoggedInUser.membership = membership;
    LoggedInUser.canEditCollective = membership && membership.role === 'MEMBER';
    console.log("Logged in user: ", LoggedInUser);
    this.setState({LoggedInUser});
    }, 0);
  }

  render() {
    const { data } = this.props;

    if (!data.loading && !data.Event) {
      return (<NotFound />)
    }

    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <EditEvent event={data.Event} LoggedInUser={this.state.LoggedInUser} />
        </div>
      </IntlProvider>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addEventData(EditEventPage)));
