import React from 'react';
import { groupBy } from 'lodash';

import { capitalize } from '../../../lib/utils';

import { Box } from '../../Grid';
import EditConnectedAccount from '../EditConnectedAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

const TITLE_OVERRIDE = {
  transferwise: 'Wise',
};

const ConnectedAccounts = props => {
  const connectedAccountsByService = groupBy(props.connectedAccounts, 'service');

  const services = [];
  if (props.services) {
    services.push(...props.services);
  } else {
    if (props.collective.type === 'COLLECTIVE' || props.collective.isHost) {
      services.push('twitter');
    }
  }

  return (
    <div className="EditConnectedAccounts">
      {services.map(service => (
        <Box key={`connect-${service}`} mb={4}>
          <SettingsSectionTitle>{TITLE_OVERRIDE[service] || capitalize(service)}</SettingsSectionTitle>
          <EditConnectedAccount
            collective={props.collective}
            service={service}
            connectedAccount={connectedAccountsByService[service] && connectedAccountsByService[service][0]}
            variation={props.variation}
          />
        </Box>
      ))}
    </div>
  );
};

export default ConnectedAccounts;
