import React from 'react';

import Tiers from './TiersLegacy';

const Tickets = props => <Tiers {...props} types={['TICKET']} defaultType="TICKET" />;

export default Tickets;
