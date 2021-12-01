import React from 'react';

import Tiers from './Tiers';

const Tickets = props => <Tiers {...props} types={['TICKET']} defaultType="TICKET" />;

export default Tickets;
