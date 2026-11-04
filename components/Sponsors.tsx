import React from 'react';

import Container from './Container';
import type { EventSponsor } from './EventSponsorCard';
import EventSponsorCard from './EventSponsorCard';

type Props = {
  sponsors: EventSponsor[];
};

class Sponsors extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { sponsors } = this.props;
    if (!sponsors || sponsors.length === 0) {
      return <div />;
    }
    return (
      <Container maxWidth="640px" margin="1.9rem auto 1.9rem" textAlign="center" overflow="hidden">
        {sponsors.map(sponsor => (
          <EventSponsorCard type="sponsor" key={sponsor.id} sponsor={sponsor} />
        ))}
      </Container>
    );
  }
}

export default Sponsors;
