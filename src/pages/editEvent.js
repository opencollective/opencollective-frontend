import withData from '../lib/withData'
import React from 'react'
import { addEventData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
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
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  async componentDidMount() {
    setTimeout(async () => {
      const res = await this.props.getLoggedInUser();
      const LoggedInUser = {...res.data.LoggedInUser};
      if (LoggedInUser && LoggedInUser.collectives) {
        const membership = LoggedInUser.collectives.find(c => c.slug === this.props.collectiveSlug);
        LoggedInUser.membership = membership;
      }
      this.setState({LoggedInUser, loading: false});
    }, 0);
  }

  render() {
    const { data } = this.props;

    if (this.state.loading) {
      return <Loading />;
    }

    if (!data.loading && !data.Event) {
      return (<NotFound />)
    }

    const { LoggedInUser } = this.state;
    const event = data.Event;

    if (LoggedInUser) {
      LoggedInUser.canEditEvent = LoggedInUser.membership && (['HOST', 'MEMBER'].indexOf(LoggedInUser.membership.role) !== -1 || event.createdByUser.id === LoggedInUser.id);
    }

    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <EditEvent event={event} LoggedInUser={LoggedInUser} />
        </div>
      </IntlProvider>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addEventData(EditEventPage)));
