import React from 'react';
import { groupBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { capitalize } from '../../../lib/utils';
import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';

import { Box } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import { P } from '../../Text';
import EditConnectedAccount from '../EditConnectedAccount';

import SettingsSectionTitle from './SettingsSectionTitle';

const TITLE_OVERRIDE = {
  transferwise: 'Wise',
};

interface ConnectedAccountsProps {
  collective: GraphQLV1Collective;
  connectedAccounts?: object[];
  editMode?: boolean;
  services?: string[];
  variation?: "SENDING" | "RECEIVING";
}

const ConnectedAccounts = (props: ConnectedAccountsProps) => {
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

export default ConnectedAccounts;
