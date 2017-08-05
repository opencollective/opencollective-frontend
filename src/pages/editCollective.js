import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addCollectiveData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import EditCollective from '../components/EditCollective';
import { intersection } from 'lodash';

class EditCollectivePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { slug } }) {
    return { slug };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({LoggedInUser, loading: false});
  }

  render() {
    const { data, slug, parentCollectiveSlug } = this.props;

    if (this.state.loading) {
      return <Loading />;
    }

    if (!data.loading && !data.Collective) {
      return (<NotFound />)
    }

    const { LoggedInUser } = this.state;
    const collective = data.Collective;

    window.OC = { collective };
    
    if (LoggedInUser) {
      LoggedInUser.canEditCollective = (collective.createdByUser && collective.createdByUser.id === LoggedInUser.id) 
        || intersection(LoggedInUser.roles[slug], ['HOST','ADMIN']).length
        || intersection(LoggedInUser.roles[parentCollectiveSlug], ['HOST','ADMIN']).length;
    }

    return (
      <div>
        <EditCollective collective={collective} LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addCollectiveData(withIntl(EditCollectivePage))));
