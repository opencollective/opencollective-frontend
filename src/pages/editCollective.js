import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';

import EditCollective from '../components/EditCollective';
import ErrorPage from '../components/ErrorPage';

import { addCollectiveToEditData } from '../graphql/queries';
import {
  addEditCollectiveMutation,
  addDeleteCollectiveMutation,
} from '../graphql/mutations';

import { getQueryParams } from '../lib/utils';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class EditCollectivePage extends React.Component {
  static getInitialProps({ query, res }) {
    if (res) {
      res.setHeader('Cache-Control', 'no-cache');
    }

    const scripts = { googleMaps: true }; // Used in <InputTypeLocation>
    return { slug: query && query.slug, query, ssr: false, scripts };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveToEditData
    ssr: PropTypes.bool,
    data: PropTypes.object.isRequired, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
    editCollective: PropTypes.func.isRequired, // from addEditCollectiveMutation
    deleteCollective: PropTypes.func.isRequired, // from addDeleteCollectiveMutation
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
    const queryParams = getQueryParams();
    if (queryParams.HostedCollectiveId) {
      this.props.data.refetch({ options: { fetchPolicy: 'network-only' } });
    }
  }

  render() {
    const { data, editCollective, deleteCollective } = this.props;
    const { loading, LoggedInUser } = this.state;

    if (loading || !data.Collective) {
      return <ErrorPage loading={loading} data={data} />;
    }

    const collective = data.Collective;

    window.OC = { collective };

    return (
      <div>
        <EditCollective
          collective={collective}
          LoggedInUser={LoggedInUser}
          editCollective={editCollective}
          deleteCollective={deleteCollective}
        />
      </div>
    );
  }
}

const addGraphQL = compose(
  addCollectiveToEditData,
  addEditCollectiveMutation,
  addDeleteCollectiveMutation,
);

export default withData(
  withIntl(withLoggedInUser(addGraphQL(EditCollectivePage))),
);
