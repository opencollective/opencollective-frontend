import React from 'react';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { capitalize } from '../../../lib/utils';

import { Box } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import { P } from '../../Text';
import EditConnectedAccount from '../EditConnectedAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

const TITLE_OVERRIDE = {
  transferwise: 'Wise',
};

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
      <P mb={4}>
        <FormattedMessage
          defaultMessage="See <Link>the documentation</Link> to learn more about Connected Accounts."
          id="5thSOv"
          values={{
            Link: getI18nLink({
              href: 'https://docs.opencollective.com/help/fiscal-hosts/fiscal-host-settings/connected-accounts',
              openInNewTab: true,
            }),
          }}
        />
      </P>
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

ConnectedAccounts.propTypes = {
  collective: PropTypes.object.isRequired,
  connectedAccounts: PropTypes.arrayOf(PropTypes.object),
  editMode: PropTypes.bool,
  services: PropTypes.arrayOf(PropTypes.string),
  variation: PropTypes.oneOf(['SENDING', 'RECEIVING']),
};

export default ConnectedAccounts;
