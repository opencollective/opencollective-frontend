import React from 'react';
import PropTypes from 'prop-types';

import EditEvent from '../components/EditEvent';
import ErrorPage from '../components/ErrorPage';

import { addEventCollectiveData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class EditEventPage extends React.Component {

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
    this.state = { loading: true };
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser, loading: false });
  }

  render() {
    const { data } = this.props;

    if (this.state.loading || !data.Collective) {
      return (<ErrorPage loading={this.state.loading} data={data} />);
    }

    const { LoggedInUser } = this.state;
    const event = data.Collective;

    return (
      <EditEvent event={event} LoggedInUser={LoggedInUser} />
    );
  }
}

export default withData(withIntl(withLoggedInUser(addEventCollectiveData(EditEventPage))));
