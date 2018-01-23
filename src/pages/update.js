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
import UpdateWithData from '../components/UpdateWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'

class UpdatesPage extends React.Component {

  static getInitialProps (props) {
    const { query: { collectiveSlug, id }, data } = props;
    return { slug: collectiveSlug, data, id }
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
    const { data, id } = this.props;
    const { LoggedInUser } = this.state;
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;
    const css = LoggedInUser && "//cdn.quilljs.com/1.2.6/quill.snow.css"; // only load html editor css when logged in
    return (
      <div className="UpdatesPage">

        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          css={css}
          />

        <Body>

          <CollectiveCover
            collective={collective}
            href={`/${collective.slug}`}
            title={<FormattedMessage id="updates.title" defaultMessage="Updates" />}
            className="small"
            style={get(collective, 'settings.style.hero.cover')}
            />

          <div className="content" >
            <UpdateWithData
              id={id}
              editable={true}
              LoggedInUser={LoggedInUser}
              />
          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}

export default withData(addGetLoggedInUserFunction(addCollectiveCoverData(withIntl(UpdatesPage))));