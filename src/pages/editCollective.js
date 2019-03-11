import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import Page from '../components/Page';
import { withUser } from '../components/UserProvider';
import EditCollective from '../components/EditCollective';
import ErrorPage from '../components/ErrorPage';
import MessageBox from '../components/MessageBox';

import { addCollectiveToEditData } from '../graphql/queries';
import { addEditCollectiveMutation, addDeleteCollectiveMutation } from '../graphql/mutations';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
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
    loadingLoggedInUser: PropTypes.bool.isRequired, // from withLoggedInUser
    editCollective: PropTypes.func.isRequired, // from addEditCollectiveMutation
    deleteCollective: PropTypes.func.isRequired, // from addDeleteCollectiveMutation
  };

  render() {
    const { data, editCollective, deleteCollective, LoggedInUser, loadingLoggedInUser } = this.props;

    if ((data && data.loading) || loadingLoggedInUser) {
      return (
        <Page>
          <Loading />
        </Page>
      );
    } else if (data && data.error) {
      return <ErrorPage data={data} />;
    } else if (!LoggedInUser || !data || !data.Collective) {
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
          collective={data.Collective}
          LoggedInUser={LoggedInUser}
          editCollective={editCollective}
          deleteCollective={deleteCollective}
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
  addDeleteCollectiveMutation,
);

export default withUser(withData(withIntl(addGraphQL(EditCollectivePage))));
