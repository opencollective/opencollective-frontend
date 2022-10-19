import React from 'react';

import { TierTypes } from '../../../lib/constants/tiers-types';

import Tiers from './Tiers';

const Tickets = props => (
  <Tiers
    {...props}
    types={[TierTypes.SINGLE_TICKET, TierTypes.MULTIPLE_TICKET]}
    defaultType={TierTypes.MULTIPLE_TICKET}
  />
);

export default Tickets;
