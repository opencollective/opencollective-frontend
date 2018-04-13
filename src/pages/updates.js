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
import MenuBar from '../components/MenuBar';
import UpdatesWithData from '../components/UpdatesWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'

class UpdatesPage extends React.Component {

  static getInitialProps (props) {
    const { query: { collectiveSlug, action }, data } = props;
    return { slug: collectiveSlug, data, action }
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({LoggedInUser});
  }

  render() {
    const { data, action } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;

    return (
      <div className="UpdatesPage">
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
            />

          <div className="content" >

            <UpdatesWithData
              collective={collective}
              includeHostedCollectives={collective.isHost}
              defaultAction={action}
              LoggedInUser={this.state.LoggedInUser}
              />

          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}

export default withData(addGetLoggedInUserFunction(addCollectiveCoverData(withIntl(UpdatesPage))));
