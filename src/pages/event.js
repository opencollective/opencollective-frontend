import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addEventData, addGetLoggedInUserFunction } from '../graphql/queries';

import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Event from '../components/Event';

class EventPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({ LoggedInUser });
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (data.loading) return (<Loading />);
    if (!data.Event) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }

    const event = data.Event;

    if (LoggedInUser && !LoggedInUser.canEditEvent) {
      LoggedInUser.canEditEvent = LoggedInUser.membership && (['HOST', 'MEMBER'].indexOf(LoggedInUser.membership.role) !== -1 || event.createdByUser.id === LoggedInUser.id);
      if (LoggedInUser.canEditEvent) {
        data.refetch(); // we refetch the data to get the email addresses of the participants
      }
    }

    return (
      <div>
        <Event event={event} LoggedInUser={LoggedInUser} client={this.props.client} />
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addEventData(withIntl(EventPage))));
