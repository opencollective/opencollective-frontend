import React from 'react';
import PropTypes from 'prop-types';

import EditEvent from '../components/EditEvent';
import ErrorPage from '../components/ErrorPage';

import { addEventCollectiveData } from '../lib/graphql/queries';

import { withUser } from '../components/UserProvider';

class EditEventPage extends React.Component {
  static getInitialProps({ query: { parentCollectiveSlug, eventSlug } }) {
    const scripts = { googleMaps: true }; // Used in <InputTypeLocation>
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
  }

  render() {
    const { data, loadingLoggedInUser, LoggedInUser } = this.props;

    if (loadingLoggedInUser || !data.Collective) {
      return <ErrorPage loading={loadingLoggedInUser} data={data} />;
    }

    const event = data.Collective;

    return <EditEvent event={event} LoggedInUser={LoggedInUser} />;
  }
}

export default withUser(addEventCollectiveData(EditEventPage));
