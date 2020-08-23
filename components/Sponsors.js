import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import EventSponsorCard from './EventSponsorCard';

const SponsorDiv = styled.div`
  max-width: 640px;
  margin: 3rem auto 3rem;
  text-align: center;
  overflow: hidden;
`;

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
      <SponsorDiv>
        {sponsors.map(sponsor => (
          <EventSponsorCard type="sponsor" key={sponsor.id} sponsor={sponsor} />
        ))}
      </SponsorDiv>
    );
  }
}

export default Sponsors;
