import React from 'react';
import { css } from 'glamor';
import Tier from './Tier';

class Tiers extends React.Component {

  static propTypes = {
    tiers: React.PropTypes.array,
    event: React.PropTypes.object
  }

  getTicket(tier) {
    const { event } = this.props;
    window.location = `/events/${event.id}/tickets/${tier.id}`;
  }

  render() {
    const { tiers } = this.props;

    return (
      <div id="tickets">
        {tiers.map((tier) =>
          <Tier
            key={tier.id}
            name={tier.name}
            description={tier.description}
            amount={tier.amount}
            currency={tier.currency}
            onClick={(tier) => this.getTicket(tier)}
            />
        )}
      </div>
    );
  }
}

export default Tiers;