import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addCollectiveData, addGetLoggedInUserFunction } from '../graphql/queries';

import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Collective from '../components/Collective';
import UserCollective from '../components/UserCollective';
import { intersection } from 'lodash';

class CollectivePage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getInitialProps ({ query: { slug, message } }) {
    return { slug, message }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { data, slug, message } = this.props;
    const { LoggedInUser } = this.state;

    console.log(">>> this.props", this.props);
    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const collective = data.Collective;

    if (LoggedInUser) {
      LoggedInUser.canEditCollective = (collective.createdByUser && collective.createdByUser.id === LoggedInUser.id) 
        || intersection(LoggedInUser.roles[slug], ['HOST','ADMIN']).length > 0;
    }

    return (
      <div>
        {collective.type === 'COLLECTIVE' && <Collective collective={collective} LoggedInUser={LoggedInUser} message={message} />}
        {['USER', 'ORGANIZATION'].includes(collective.type) && <UserCollective collective={collective} LoggedInUser={LoggedInUser} message={message} />}
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addCollectiveData(withIntl(CollectivePage))));
