import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';
import { get } from 'lodash';

import Page from '../components/Page';
import { withUser } from '../components/UserProvider';
import EditCollective from '../components/edit-collective/EditCollective';
import ErrorPage from '../components/ErrorPage';
import MessageBox from '../components/MessageBox';

import { compose } from '../lib/utils';
import { addCollectiveToEditData } from '../lib/graphql/queries';
import { addEditCollectiveMutation } from '../lib/graphql/mutations';

import Loading from '../components/Loading';

class EditCollectivePage extends React.Component {
  static getInitialProps({ query, res }) {
    if (res) {
      res.set('Cache-Control', 'no-cache');
    }

    const scripts = { googleMaps: true }; // Used in <InputTypeLocation>
    return { slug: query && query.slug, query, ssr: false, scripts };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveToEditData
    ssr: PropTypes.bool,
    data: PropTypes.object, // from withData
    LoggedInUser: PropTypes.object, // from withLoggedInUser
    loadingLoggedInUser: PropTypes.bool, // from withLoggedInUser
    editCollective: PropTypes.func.isRequired, // from addEditCollectiveMutation
  };

  constructor(props) {
    super(props);
    this.state = { Collective: get(props, 'data.Collective') };
  }

  async componentDidMount() {
    const collective = get(this.props, 'data.Collective');
    this.setState({ Collective: collective || this.state.Collective });
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.Collective');
    if (currentCollective && get(oldProps, 'data.Collective') !== currentCollective) {
      this.setState({ Collective: currentCollective });
    }
  }

  render() {
    const { data, editCollective, LoggedInUser, loadingLoggedInUser } = this.props;
    const collective = get(data, 'Collective') || this.state.Collective;

    if ((data && data.loading) || loadingLoggedInUser) {
      return (
        <Page>
          <Flex justifyContent="center" py={6}>
            <Loading />
          </Flex>
        </Page>
      );
    } else if (data && data.error) {
      return <ErrorPage data={data} />;
    } else if (!LoggedInUser || !collective) {
      return (
        <Page>
          <Flex justifyContent="center" p={5}>
            <MessageBox type="error" withIcon>
              {LoggedInUser ? (
                <FormattedMessage id="editCollective.notFound" defaultMessage="No collective data to edit" />
              ) : (
                <FormattedMessage id="mustBeLoggedIn" defaultMessage="You must be logged in to see this page" />
              )}
            </MessageBox>
          </Flex>
        </Page>
      );
    }

    return (
      <div>
        <EditCollective
          collective={collective}
          LoggedInUser={LoggedInUser}
          editCollective={editCollective}
          loggedInEditDataLoaded
        />
      </div>
    );
  }
}

const addGraphQL = compose(
  component =>
    addCollectiveToEditData(component, {
      skip: props => props.loadingLoggedInUser || !props.LoggedInUser,
    }),
  addEditCollectiveMutation,
);

export default withUser(addGraphQL(EditCollectivePage));
