import React from 'react';
import { FormattedMessage } from 'react-intl';

import { hasAccountMoneyManagement } from '@/lib/collective';
import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';

import { DashboardContext } from '../dashboard/DashboardContext';
import MessageBox from '../MessageBox';
import { Button } from '../ui/Button';

import SettingsSectionTitle from './sections/SettingsSectionTitle';
import { ConvertToCollectiveModal } from './ConvertToCollectiveModal';

const getBlockReason = (account, collective): 'MONEY_MANAGEMENT' | 'HOSTING' | 'ZERO_BALANCE' | null => {
  if (collective.stats.balance > 0) {
    return 'ZERO_BALANCE';
  } else if (hasAccountMoneyManagement(account)) {
    return 'MONEY_MANAGEMENT';
  } else if (account.hasHosting) {
    return 'HOSTING';
  }
  return null;
};

export function ConvertToCollective({ collective }: { collective: GraphQLV1Collective }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { account } = React.useContext(DashboardContext); // The convert to collective modal needs an Account from GraphQL V2

  const blockReason = getBlockReason(account, collective);

  return (
    <div className="mb-8 flex flex-col items-start gap-2">
      <SettingsSectionTitle>
        <FormattedMessage defaultMessage="Convert to Collective" id="convertToCollective.button" />
      </SettingsSectionTitle>
      <p className="text-sm">
        <FormattedMessage
          defaultMessage="Convert {name} to a Collective. This will prevent you from using money management and fiscal hosting capabilities, and you will have to apply to a Fiscal Host."
          id="convertToCollective.description"
          values={{ name: <span className="font-medium italic">{collective.name}</span> }}
        />
      </p>
      {blockReason && (
        <MessageBox type="warning">
          {blockReason === 'MONEY_MANAGEMENT' ? (
            <FormattedMessage
              defaultMessage="You must deactivate Money Management before converting to a Collective."
              id="convertToCollective.block.moneyManagement"
            />
          ) : blockReason === 'HOSTING' ? (
            <FormattedMessage
              defaultMessage="You must deactivate Fiscal Hosting before converting to a Collective."
              id="convertToCollective.block.hosting"
            />
          ) : blockReason === 'ZERO_BALANCE' ? (
            <FormattedMessage
              defaultMessage="Only Organizations with a zero balance can be converted to a Collective. To pay out remaining funds, submit an expense and mark it as paid."
              id="convertToCollective.block.balanceNotEmpty"
            />
          ) : null}
        </MessageBox>
      )}
      <Button variant="outline" onClick={() => setIsModalOpen(true)} disabled={Boolean(blockReason)}>
        <FormattedMessage defaultMessage="Convert to Collective" id="convertToCollective.button" />
      </Button>
      <ConvertToCollectiveModal open={isModalOpen} setOpen={setIsModalOpen} collective={account} />
    </div>
  );
}
