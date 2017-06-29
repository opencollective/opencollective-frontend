import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import React from 'react'
import { addEventData, addGetLoggedInUserFunction } from '../graphql/queries';
import NotFound from '../components/NotFound';
import Loading from '../components/Loading';
import EditEvent from '../components/EditEvent';


class EditEventPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser && getLoggedInUser(this.props.collectiveSlug);
    this.setState({LoggedInUser, loading: false});
  }

  render() {
    const { data } = this.props;

    if (this.state.loading) {
      return <Loading />;
    }

    if (!data.loading && !data.Event) {
      return (<NotFound />)
    }

    const { LoggedInUser } = this.state;
    const event = data.Event;

    if (LoggedInUser) {
      LoggedInUser.canEditEvent = LoggedInUser.membership && (['HOST', 'MEMBER'].indexOf(LoggedInUser.membership.role) !== -1 || event.createdByUser.id === LoggedInUser.id);
    }

    return (
      <div>
        <EditEvent event={event} LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(addGetLoggedInUserFunction(addEventData(withIntl(EditEventPage))));
