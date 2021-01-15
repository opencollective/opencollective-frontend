import React from 'react';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';

import { capitalize } from '../../../lib/utils';

import { Box } from '../../Grid';
import EditConnectedAccount from '../EditConnectedAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

const ConnectedAccounts = props => {
  const connectedAccountsByService = groupBy(props.connectedAccounts, 'service');

  let services = [];
  if (props.services) {
    services = [...props.services, ...services];
  } else {
    if (props.collective.type === 'COLLECTIVE' || props.collective.isHost) {
      services.push('twitter');
    }
  }

  return (
    <div className="EditConnectedAccounts">
      {services.map(service => (
        <Box key={`connect-${service}`} mb={4}>
          <SettingsSectionTitle>{capitalize(service)}</SettingsSectionTitle>
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

ConnectedAccounts.propTypes = {
  collective: PropTypes.object.isRequired,
  connectedAccounts: PropTypes.arrayOf(PropTypes.object),
  editMode: PropTypes.bool,
  services: PropTypes.arrayOf(PropTypes.string),
  variation: PropTypes.oneOf(['SENDING', 'RECEIVING']),
};

export default ConnectedAccounts;
