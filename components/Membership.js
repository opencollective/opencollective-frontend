import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import CollectiveCard from './CollectiveCard';

const MembershipContainer = styled.div`
  float: left;
  margin: 1rem;
`;

class Membership extends React.Component {
  static propTypes = {
    memberships: PropTypes.array.isRequired,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { memberships, LoggedInUser } = this.props;
    const { collective } = memberships[0];

    if (!collective) {
      console.warn('Membership -> no collective attached', memberships[0]);
      return <div />;
    }

    const name = (collective.name && collective.name.match(/^null/) ? null : collective.name) || collective.slug;

    if (!name) {
      return <div />;
    }

    return (
      <React.Fragment>
        <MembershipContainer>
          <CollectiveCard memberships={memberships} collective={collective} LoggedInUser={LoggedInUser} />
        </MembershipContainer>
      </React.Fragment>
    );
  }
}

export default Membership;
