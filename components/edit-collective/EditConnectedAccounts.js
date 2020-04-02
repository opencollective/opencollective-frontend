import React from 'react';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';
import { capitalize } from '../../lib/utils';
import EditConnectedAccount from '../EditConnectedAccount';

const EditConnectedAccounts = props => {
  const connectedAccountsByService = groupBy(props.connectedAccounts, 'service');

  const services = [];

  if (props.collective.type === 'COLLECTIVE' || props.collective.isHost) {
    services.push('twitter');
  }

  return (
    <div className="EditConnectedAccounts">
      {services.map(service => (
        <div key={`connect-${service}`}>
          <h2>{capitalize(service)}</h2>
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

EditConnectedAccounts.propTypes = {
  collective: PropTypes.object.isRequired,
  connectedAccounts: PropTypes.arrayOf(PropTypes.object),
  editMode: PropTypes.bool,
};

export default EditConnectedAccounts;
