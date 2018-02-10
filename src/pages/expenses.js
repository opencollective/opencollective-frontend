import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveCoverData, addGetLoggedInUserFunction } from '../graphql/queries';
import Loading from '../components/Loading';
import NotFound from '../components/NotFoundPage';
import ErrorPage from '../components/ErrorPage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpensesWithData from '../components/ExpensesWithData';
import ExpensesStatsWithData from '../components/ExpensesStatsWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'
import Button from '../components/Button';

class ExpensesPage extends React.Component {

  static getInitialProps (props) {
    const { query: { collectiveSlug }, data } = props;
    return { slug: collectiveSlug, data }
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({ LoggedInUser });
  }

  render() {
    const { data, action } = this.props;
    const { LoggedInUser } = this.state;

    if (!data.loading && !data.Collective) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;

    return (
      <div className="ExpensesPage">
        <style jsx>{`
          .columns {
            display: flex;
          }

          .col.side {
            width: 100%;
            min-width: 20rem;
            max-width: 25%;
            margin-left: 5rem;
          }

          .col.large {
            width: 100%;
            min-width: 30rem;
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
            cta={{ href: `/${collective.slug}#contribute`, label: 'contribute' }}
            LoggedInUser={LoggedInUser}
            />

          <div className="content columns" >

            <div className="col large">
              <ExpensesWithData
                collective={collective}
                defaultAction={action}
                LoggedInUser={this.state.LoggedInUser}
                />
            </div>

            <div className="col side">
              <ExpensesStatsWithData slug={collective.slug} />
            </div>

          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}

export default withData(addGetLoggedInUserFunction(addCollectiveCoverData(withIntl(ExpensesPage))));