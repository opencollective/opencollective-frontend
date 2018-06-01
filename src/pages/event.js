import React from 'react';
import PropTypes from 'prop-types';

import ErrorPage from '../components/ErrorPage';
import Event from '../components/Event';

import { addEventCollectiveData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class EventPage extends React.Component {

  static getInitialProps ({ query: { parentCollectiveSlug, eventSlug } }) {
    return { parentCollectiveSlug, eventSlug };
  }

  static propTypes = {
    parentCollectiveSlug: PropTypes.string, // not used atm
    eventSlug: PropTypes.string, // for addEventCollectiveData
    data: PropTypes.object.isRequired, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.state;

    if (!data.Collective) return (<ErrorPage data={data} />);

    const event = data.Collective;

    if (LoggedInUser && LoggedInUser.canEditEvent(event)) {
      // We refetch the data to get the email addresses of the participants
      // We need to bypass the cache otherwise it won't update the list of participants with the email addresses
      data.refetch({ options: { fetchPolicy: 'network-only' } });
    }

    return (
      <div>
        <Event event={event} LoggedInUser={LoggedInUser} />
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(addEventCollectiveData(EventPage))));
