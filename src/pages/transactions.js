import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveTransactionsData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Error from '../components/Error';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import Transactions from '../components/Transactions';
import { get } from 'lodash';
import {defineMessages} from 'react-intl'

class TransactionsPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug }, data }) {
    return { collectiveSlug, data }
  }

  constructor(props) {
    super(props);
    this.state = {};
    this.messages = defineMessages({
      title: { id: 'transactions.title', defaultMessage: `{n, plural, one {Latest transaction} other {Latest transactions}}` }
    });
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    LoggedInUser.canEditCollective = LoggedInUser.membership && (['HOST', 'MEMBER'].indexOf(LoggedInUser.membership.role) !== -1);
    this.setState({LoggedInUser});
  }

  render() {
    const { intl, data } = this.props;
    const { LoggedInUser } = this.state;
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const collective = data.Collective;
    const transactions = data.allTransactions;

    return (
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
            collective={collective}
            logo={collective.logo}
            title={intl.formatMessage(this.messages['title'], { n: transactions.length })}
            className="small"
            backgroundImage={collective.backgroundImage}
            style={get(collective, 'settings.style.hero.cover')}
            />

          <div className="content" >

            <Transactions
              collective={collective}
              transactions={transactions}
              refetch={data.refetch}
              fetchMore={this.props.fetchMore}
              LoggedInUser={LoggedInUser}
              />

          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}

export default withData(addGetLoggedInUserFunction(addCollectiveTransactionsData(withIntl(TransactionsPage))));