import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveCoverData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Error from '../components/Error';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpensesWithData from '../components/ExpensesWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'

class ExpensesPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug }, data }) {
    return { slug: collectiveSlug, data }
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    LoggedInUser.canEditCollective = LoggedInUser.membership && (['HOST', 'MEMBER'].indexOf(LoggedInUser.membership.role) !== -1);
    this.setState({LoggedInUser});
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;
    console.log(">>> data.Collective", data.Collective);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const collective = data.Collective;

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

            <ExpensesWithData
              collective={collective}
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