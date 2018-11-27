import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';

import EditCollective from '../components/EditCollective';
import ErrorPage from '../components/ErrorPage';

import { addCollectiveToEditData } from '../graphql/queries';
import { addEditCollectiveMutation, addDeleteCollectiveMutation } from '../graphql/mutations';

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
    this.state = { loading: true, loggedInEditDataLoaded: false };
  }

  componentDidMount() {
    this.props.getLoggedInUser().then(LoggedInUser => {
      this.setState({ LoggedInUser, loading: false });
    });

    // Now we're logged in, let's refetch edit data
    this.props.data
      .refetch({ options: { fetchPolicy: 'network-only' } })
      .then(() => this.setState({ loggedInEditDataLoaded: true }));
  }

  render() {
    const { data, editCollective, deleteCollective } = this.props;
    const { loading, LoggedInUser, loggedInEditDataLoaded } = this.state;

    if (loading || !data.Collective || data.error) {
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
          loggedInEditDataLoaded={loggedInEditDataLoaded}
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

export default withData(withIntl(withLoggedInUser(addGraphQL(EditCollectivePage))));
