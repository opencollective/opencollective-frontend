import React from 'react';
import PropTypes from 'prop-types';

import { addEditCollectiveMutation } from '../lib/graphql/mutations';
import { addEventCollectiveData } from '../lib/graphql/queries';
import { compose } from '../lib/utils';

import EditCollective from '../components/edit-collective';
import ErrorPage from '../components/ErrorPage';
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
    editCollective: PropTypes.func.isRequired, // from addEditCollectiveMutation
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { data, loadingLoggedInUser, LoggedInUser, editCollective } = this.props;

    if (loadingLoggedInUser || !data.Collective) {
      return <ErrorPage loading={loadingLoggedInUser} data={data} />;
    }

    const event = data.Collective;
    return <EditCollective editCollective={editCollective} collective={event} LoggedInUser={LoggedInUser} />;
  }
}

const addGraphQL = compose(addEventCollectiveData, addEditCollectiveMutation);

export default withUser(addGraphQL(EditEventPage));
