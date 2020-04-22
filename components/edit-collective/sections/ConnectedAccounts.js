import React from 'react';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';

import { capitalize } from '../../../lib/utils';

import { H4 } from '../../Text';

import EditConnectedAccount from '../EditConnectedAccount';

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
        <div key={`connect-${service}`}>
          <H4 mt={2}>{capitalize(service)}</H4>
          <EditConnectedAccount
            collective={props.collective}
            service={service}
            connectedAccount={connectedAccountsByService[service] && connectedAccountsByService[service][0]}
          />
        </div>
      ))}
    </div>
  );
};

ConnectedAccounts.propTypes = {
  collective: PropTypes.object.isRequired,
  connectedAccounts: PropTypes.arrayOf(PropTypes.object),
  editMode: PropTypes.bool,
  services: PropTypes.arrayOf(PropTypes.string),
};

export default ConnectedAccounts;
