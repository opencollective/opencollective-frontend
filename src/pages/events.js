import React from 'react';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import EventsWithData from '../components/EventsWithData';

class Events extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  render() {
    return (
      <EventsWithData collectiveSlug={this.props.collectiveSlug} />
    );
  }

}

export default withData(withIntl(Events));