import React from 'react';

import CollectiveCard from './CollectiveCard';
import Container from './Container';

class Membership extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { memberships, LoggedInUser } = this.props;
    const { collective } = memberships[0];

    if (!collective) {
      // eslint-disable-next-line no-console
      console.warn('Membership -> no collective attached', memberships[0]);
      return <div />;
    }

    const name = (collective.name && collective.name.match(/^null/) ? null : collective.name) || collective.slug;

    if (!name) {
      return <div />;
    }

    return (
      <React.Fragment>
        <Container float="left" margin="0.65rem">
          <CollectiveCard memberships={memberships} collective={collective} LoggedInUser={LoggedInUser} />
        </Container>
      </React.Fragment>
    );
  }
}

export default Membership;
