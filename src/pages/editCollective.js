import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import PropTypes from 'prop-types';
import { addCollectiveToEditData, addGetLoggedInUserFunction } from '../graphql/queries';
import { addEditCollectiveMutation, addDeleteCollectiveMutation } from '../graphql/mutations';
import { compose } from '../../node_modules/react-apollo';
import ErrorPage from '../components/ErrorPage';
import EditCollective from '../components/EditCollective';
import { getQueryParams } from '../lib/utils';

class EditCollectivePage extends React.Component {

  static getInitialProps ({ query, res }) {

    if (res){
      res.setHeader('Cache-Control','no-cache');
    }

    return { slug: query && query.slug, query, ssr: false }
  }

  static propTypes = {
    data: PropTypes.object.isRequired,
    editCollective: PropTypes.func.isRequired,
    deleteCollective: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
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
      return (<ErrorPage loading={loading} data={data} />)
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
  addGetLoggedInUserFunction,
  addCollectiveToEditData,
  addEditCollectiveMutation,
  addDeleteCollectiveMutation
);

export default withData(addGraphQL(withIntl(EditCollectivePage)));
