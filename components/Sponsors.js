import React from 'react';
import PropTypes from 'prop-types';

import Container from './Container';
import EventSponsorCard from './EventSponsorCard';

class Sponsors extends React.Component {
  static propTypes = {
    sponsors: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { sponsors } = this.props;
    if (!sponsors || sponsors.length === 0) {
      return <div />;
    }
    return (
      <Container maxWidth="640px" margin="3rem auto 3rem" textAlign="center" overflow="hidden">
        {sponsors.map(sponsor => (
          <EventSponsorCard type="sponsor" key={sponsor.id} sponsor={sponsor} />
        ))}
      </Container>
    );
  }
}

export default Sponsors;
