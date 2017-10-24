import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpensesWithData from '../components/ExpensesWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'
import CollectivePicker from '../components/CollectivePickerWithData';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import ConnectPaypal from '../components/ConnectPaypal';

class HostExpensesPage extends React.Component {

  static getInitialProps (props) {
    const { query, data } = props;
    return { collectiveSlug: query.hostCollectiveSlug, data, query, ssr: false }
  }

  constructor(props) {
    super(props);
    this.state = { CollectiveId: null };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    if (LoggedInUser) {
      LoggedInUser.canEditCollective = LoggedInUser.membership && (['HOST', 'MEMBER'].indexOf(LoggedInUser.membership.role) !== -1);
    }
    this.setState({LoggedInUser});
  }

  pickCollective(CollectiveId) {
    this.setState({ CollectiveId });
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;
    
    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }
    
    if (!data.Collective) return (<Loading />);

    const collective = data.Collective;
    const collectiveId = this.state.CollectiveId || collective.id;
    const includeHostedCollectives = (collectiveId === collective.id);

    return (
      <div className="HostExpensesPage">

        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          />

        <Body>

          <CollectiveCover
            collective={collective}
            href={`/${collective.slug}`}
            title={<FormattedMessage id="collective.Expenses.title" defaultMessage="{n, plural, one {Latest Expense} other {Latest Expenses}}" values={{n: 2 }} />}
            className="small"
            style={get(collective, 'settings.style.hero.cover')}
            />

          <div className="content" >

            <ConnectPaypal
              collective={collective}
              />

            <CollectivePicker
              hostCollectiveSlug={this.props.collectiveSlug}
              onChange={(CollectiveId => this.pickCollective(CollectiveId))}
              />

            <ExpensesWithData
              collective={{ id: collectiveId }}
              includeHostedCollectives={includeHostedCollectives}
              LoggedInUser={this.state.LoggedInUser}
              />

          </div>

        </Body>

        <Footer />

      </div>
    );
  }
}

const getDataQuery = gql`
query Collective($collectiveSlug: String!) {
  Collective(slug: $collectiveSlug) {
    id
    type
    slug
    name
    currency
    backgroundImage
    settings
    image
    isHost
    paymentMethods {
      id
      service
      createdAt
      balance
      currency
    }
  }
}
`;

export const addData = graphql(getDataQuery);

export default withData(addGetLoggedInUserFunction(addData(withIntl(HostExpensesPage))));