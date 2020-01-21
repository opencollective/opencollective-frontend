import React from 'react';
import PropTypes from 'prop-types';

import ErrorPage from '../components/ErrorPage';
import Event from '../components/Event';

import { addEventCollectiveData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';

class EventPage extends React.Component {
  static getInitialProps({ req, res, query }) {
    const { parentCollectiveSlug, eventSlug } = query;

    if (res && req && (req.language || req.locale === 'en')) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
    }

    const scripts = { googleMaps: true }; // Used in <Event> -> <Location> -> <Map>

    return { parentCollectiveSlug, eventSlug, scripts };
  }

  static propTypes = {
    parentCollectiveSlug: PropTypes.string, // not used atm
    eventSlug: PropTypes.string, // for addEventCollectiveData
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = {
      alreadyRefetch: false,
    };
  }

  async componentDidMount() {
    this.checkForRefetch();
  }

  async componentDidUpdate() {
    this.checkForRefetch();
  }

  checkForRefetch() {
    const { alreadyRefetch } = this.state;
    if (alreadyRefetch) {
      return;
    }

    const { loadingLoggedInUser, LoggedInUser, data } = this.props;
    const event = data.Collective;

    if (!loadingLoggedInUser && LoggedInUser && LoggedInUser.canEditEvent(event)) {
      // We refetch the data to get the email addresses of the participants
      // We need to bypass the cache otherwise it won't update the list of participants with the email addresses
      data.refetch({ options: { fetchPolicy: 'network-only' } });

      this.setState({
        alreadyRefetch: true,
      });
    }
  }

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const event = data.Collective;

    return (
      <div>
        <Event event={event} LoggedInUser={LoggedInUser} isLoading={data.loading} />
      </div>
    );
  }
}

export default withUser(addEventCollectiveData(EventPage));
