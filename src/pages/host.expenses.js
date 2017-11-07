import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveCoverData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import ErrorPage from '../components/ErrorPage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpensesWithData from '../components/ExpensesWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'
import CollectivePicker from '../components/CollectivePickerWithData';

class ExpensesPage extends React.Component {

  static getInitialProps (props) {
    const { query: { hostCollectiveSlug }, data } = props;
    return { slug: hostCollectiveSlug, data }
  }

  constructor(props) {
    super(props);
    this.state = { CollectiveId: null };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({LoggedInUser});
  }

  pickCollective(CollectiveId) {
    this.setState({ CollectiveId });
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;
    const collectiveId = this.state.CollectiveId || collective.id;
    const includeHostedCollectives = (collectiveId === collective.id);

    return (
      <div className="ExpensesPage">

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

            <CollectivePicker
              hostCollectiveSlug={this.props.slug}
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

export default withData(addGetLoggedInUserFunction(addCollectiveCoverData(withIntl(ExpensesPage))));