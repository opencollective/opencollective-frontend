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
import { get, pick } from 'lodash';
import { FormattedMessage } from 'react-intl'
import CollectivePicker from '../components/CollectivePickerWithData';
import ExpensesStatsWithData from '../components/ExpensesStatsWithData';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class HostExpensesPage extends React.Component {

  static getInitialProps (props) {
    const { query, data } = props;
    return { collectiveSlug: query.hostCollectiveSlug, data, query, ssr: false }
  }

  constructor(props) {
    super(props);
    this.state = { selectedCollective: null };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({ LoggedInUser });
  }

  pickCollective(selectedCollective) {
    this.setState({ selectedCollective });
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
    const selectedCollective = this.state.selectedCollective || collective;
    const includeHostedCollectives = (selectedCollective.id === collective.id);

    if (!collective.isHost) {
      return (<ErrorPage message="collective.is.not.host" />)
    }

    return (
      <div className="HostExpensesPage">
        <style jsx>{`
        .col.side {
          width: 100%;
          min-width: 20rem;
          max-width: 25%;
          margin-left: 5rem;
        }

        .col.large {
          margin-left: 6rem;
          min-width: 30rem;
          width: 50%;
          max-width: 75%;
        }

        @media(max-width: 600px) {
          .columns {
            flex-direction: column-reverse;
            .col {
              max-width: 100%;
            }
          }
        }
        `}</style>

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
            className="small"
            style={get(collective, 'settings.style.hero.cover')}
            />

          <CollectivePicker
            hostCollectiveSlug={this.props.collectiveSlug}
            LoggedInUser={LoggedInUser}
            onChange={(selectedCollective => this.pickCollective(selectedCollective))}
            />

          <div className="content">

            <div className="col large pullLeft">
              <ExpensesWithData
                collective={selectedCollective}
                includeHostedCollectives={includeHostedCollectives}
                LoggedInUser={this.state.LoggedInUser}
                filters={true}
                editable={true}
                />
            </div>

            { this.state.selectedCollective &&
              <div className="col side pullLeft">
                <ExpensesStatsWithData slug={selectedCollective.slug} />
              </div>
            }

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
  }
}
`;

export const addData = graphql(getDataQuery);
export default withData(addGetLoggedInUserFunction(addData(withIntl(HostExpensesPage))));
