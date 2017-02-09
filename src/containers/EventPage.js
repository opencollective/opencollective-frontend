import React from 'react'
import Event from '../components/Event';

class EventPage extends React.Component {
  render() {
    const { collectiveSlug, eventSlug } = this.props.params;
    return (
      <Event collectiveSlug={collectiveSlug} eventSlug={eventSlug} />
    );
  }
}

export default EventPage;
