import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveTransactionsData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import Error from '../components/Error';
import withData from '../lib/withData';
import { IntlProvider, addLocaleData } from 'react-intl';
import { FormattedDate, FormattedMessage } from 'react-intl';
import Transactions from '../components/Transactions';
import 'intl';
import 'intl/locale-data/jsonp/en.js'; // for old browsers without window.Intl
import en from 'react-intl/locale-data/en';
import enUS from '../lang/en-US.json';
import { get } from 'lodash';

addLocaleData([...en]);
addLocaleData({
    locale: 'en-US',
    parentLocale: 'en',
});

class TransactionsPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const LoggedInUser = await this.props.getLoggedInUser(this.props.collectiveSlug);
    LoggedInUser.canCreateEvent = Boolean(LoggedInUser.membership);
    this.setState({LoggedInUser});
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const collective = data.Collective;
    const transactions = data.allTransactions;

    return (
      <IntlProvider locale="en-US" messages={enUS}>
        <div className="TransactionsPage">

          <Header
            title={collective.name}
            description={collective.description}
            twitterHandle={collective.twitterHandle}
            image={collective.logo || collective.backgroundImage}
            className={this.state.status}
            LoggedInUser={LoggedInUser}
            />

          <Body>

            <CollectiveCover
              logo={collective.logo}
              title={collective.name}
              className="small"
              backgroundImage={collective.backgroundImage}
              style={get(collective, 'settings.style.hero.cover')}
              />

            <div className="content" >

              <h2>
                <FormattedMessage id='transactions.title' values={{n: transactions.length}} defaultMessage={`{n, plural, one {Latest transaction} other {Latest transactions}}`} />
              </h2>

              <Transactions
                collective={collective}
                transactions={transactions}
                fetchMore={this.props.fetchMore}
                />

            </div>

          </Body>

          <Footer />

        </div>
      </IntlProvider>
    );
  }

}

export default withData(addGetLoggedInUserFunction(addCollectiveTransactionsData(TransactionsPage)));