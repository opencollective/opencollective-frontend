import React from 'react';
import PropTypes from 'prop-types';

import EventsWithData from '../components/EventsWithData';

class EventsPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { collectiveSlug };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
  };

  render() {
    const { collectiveSlug } = this.props;
    return <EventsWithData collectiveSlug={collectiveSlug} />;
  }
}

export default EventsPage;
