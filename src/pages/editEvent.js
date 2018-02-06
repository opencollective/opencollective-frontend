import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addEventCollectiveData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import EditEvent from '../components/EditEvent';
import { intersection } from 'lodash';

class EditEventPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { parentCollectiveSlug, eventSlug } }) {
    return { parentCollectiveSlug, eventSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
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
    const event = data.Collective;

    if (LoggedInUser) {
      LoggedInUser.canEditEvent = (event.createdByUser && event.createdByUser.id === LoggedInUser.id) 
        || intersection(LoggedInUser.roles[slug], ['HOST','ADMIN']).length > 0
        || intersection(LoggedInUser.roles[parentCollectiveSlug], ['HOST','ADMIN']).length > 0;
    }

    return (
      <div>
        <EditEvent event={event} LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addEventCollectiveData(withIntl(EditEventPage))));
