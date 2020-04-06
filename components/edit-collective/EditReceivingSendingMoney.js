import React from 'react';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';

import { capitalize, parseToBoolean } from '../../lib/utils';
import hasFeature, { FEATURES } from '../../lib/allowed-features';

import { H4 } from '../Text';

import EditConnectedAccount from './EditConnectedAccount';

const EditReceivingSendingMoney = props => {
  const connectedAccountsByService = groupBy(props.connectedAccounts, 'service');

  const services = [];

  if (!props.sendingMoney) {
    services.push('stripe');
  }

  if (
    props.sendingMoney &&
    (hasFeature(props.collective, FEATURES.TRANSFERWISE) || parseToBoolean(process.env.TRANSFERWISE_ENABLED))
  ) {
    services.push('transferwise');
  }

  return (
    <div className="EditReceivingSendingMoney">
      {services.map(service => (
        <div key={`connect-${service}`}>
          <H4>{capitalize(service)}</H4>
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

EditReceivingSendingMoney.propTypes = {
  collective: PropTypes.object.isRequired,
  connectedAccounts: PropTypes.arrayOf(PropTypes.object),
  editMode: PropTypes.bool,
  sendingMoney: PropTypes.bool,
};

export default EditReceivingSendingMoney;
