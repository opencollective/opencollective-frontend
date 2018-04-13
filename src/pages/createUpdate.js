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
import UpdatesWithData from '../components/UpdatesWithData';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl'
import EditUpdateForm from '../components/EditUpdateForm';
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { Router } from '../server/pages';
import Button from '../components/Button';

class CreateUpdatePage extends React.Component {

  static getInitialProps (props) {
    const { query: { collectiveSlug, action }, data } = props;
    return { slug: collectiveSlug, data, action }
  }

  constructor(props) {
    super(props);
    this.state = { update: {} };
    this.handleChange = this.handleChange.bind(this);
    this.createUpdate = this.createUpdate.bind(this);
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({LoggedInUser});
  }

  handleChange(attr, value) {
    const update = this.state.update;
    update[attr] = value;
    this.setState({ update, isModified: true });
  }

  async createUpdate(update) {
    const { LoggedInUser, data: { Collective } } = this.props;
    try {
      update.collective = { id: Collective.id };
      console.log(">>> createUpdate", update);
      const res = await this.props.createUpdate(update);
      console.log(">>> createUpdate res", res);
      this.setState({ isModified: false });
      return Router.pushRoute(`/${Collective.slug}/updates/${res.data.createUpdate.slug}`);
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const { data, action } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.loading && !data.Collective) {
      return (<NotFound />)
    }

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;
    const canCreateUpdate = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <div className="CreateUpdatePage">
        <style jsx global>{`
          .CreateUpdatePage .Updates .update {
            border-top: 1px solid #CACBCC;
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
            title={<FormattedMessage id="updates.new.title" defaultMessage="New update" />}
            className="small"
            style={get(collective, 'settings.style.hero.cover')}
            />

          <div className="content" >
            {!canCreateUpdate &&
              <div className="login">
                <p><FormattedMessage id="updates.create.login" defaultMessage="You need to be logged in as a core contributor of this collective to be able to create an update." /></p>
                <p><Button className="blue" href={`/signin?next=/${collective.slug}/updates/new`}><FormattedMessage id="login.button" defaultMessage="login" /></Button></p>
              </div>
            }
            { canCreateUpdate &&
              <EditUpdateForm collective={collective} onSubmit={this.createUpdate} />
            }

          </div>

        </Body>

        <Footer />

      </div>
    );
  }

}
const createUpdateQuery = gql`
mutation createUpdate($update: UpdateInputType!) {
  createUpdate(update: $update) {
    id
    slug
    title
    summary
    html
    createdAt
    publishedAt
    updatedAt
    tags
    image
    collective {
      id
      slug
    }
    fromCollective {
      id
      type
      name
      slug
      image
    }
  }
}
`;

const addMutation = graphql(createUpdateQuery, {
  props: ( { mutate }) => ({
    createUpdate: async (update) => {
      return await mutate({ variables: { update } })
    }
  })
});

const addGraphQL = compose(addGetLoggedInUserFunction, addCollectiveCoverData, addMutation);

export default withData(addGraphQL(withIntl(CreateUpdatePage)));
