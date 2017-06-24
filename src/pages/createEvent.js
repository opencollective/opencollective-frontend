import withData from '../lib/withData'
import React from 'react'
import CreateEvent from '../components/CreateEvent';
import { IntlProvider, addLocaleData } from 'react-intl';
import { addGetLoggedInUserFunction, addCollectiveData } from '../graphql/queries';
import NotFound from '../components/NotFound';

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

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  async componentDidMount() {
    setTimeout(async () => {
    const res = await this.props.getLoggedInUser();
    const LoggedInUser = res.data.LoggedInUser;
    console.log("Logged in user: ", LoggedInUser);
    this.setState({LoggedInUser});
    }, 0);
  }

  render() {

    const { data } = this.props;

    if (!data.loading && !data.Collective) {
      return (<NotFound />)
    }

    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <CreateEvent collective={data.Collective} LoggedInUser={this.state.LoggedInUser} />
        </div>
      </IntlProvider>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addCollectiveData(CreateEventPage)));
