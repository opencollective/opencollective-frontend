import React from 'react';
import { omit } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';
import { parseToBoolean } from '@/lib/utils';

import { DashboardContext } from '../dashboard/DashboardContext';
import MessageBox from '../MessageBox';
import { Button } from '../ui/Button';

import SettingsSectionTitle from './sections/SettingsSectionTitle';
import { ConvertToOrganizationModal } from './ConvertToOrganizationModal';

const getBlockReason = (collective: GraphQLV1Collective): 'HOSTED' | 'BALANCE_NOT_EMPTY' | null => {
  if (collective.host) {
    return 'HOSTED';
  } else if (collective.stats?.balance > 0) {
    return 'BALANCE_NOT_EMPTY';
  }
  return null;
};

export function ConvertToOrganization({ collective }: { collective: GraphQLV1Collective }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { account } = React.useContext(DashboardContext); // The convert to organization modal needs an Account from GraphQL V2

  // Check for query parameter to auto-open modal
  React.useEffect(() => {
    if (parseToBoolean(router.query.convertToOrg)) {
      setIsModalOpen(true);
      // Remove query parameter from URL without reloading
      router.replace({ pathname: router.pathname, query: omit(router.query, 'convertToOrg') }, undefined, {
        shallow: true,
      });
    }
  }, [router.query.convertToOrg, router]);

  const blockReason = getBlockReason(collective);
  return (
    <div className="mb-8 flex flex-col items-start gap-2">
      <SettingsSectionTitle>
        <FormattedMessage defaultMessage="Convert to Organization" id="convertToOrg.button" />
      </SettingsSectionTitle>
      <p className="text-sm">
        <FormattedMessage
          defaultMessage="Convert {name} to an Organization to enable money management and fiscal hosting capabilities."
          id="smuSiU"
          values={{ name: <span className="font-medium italic">{collective.name}</span> }}
        />
      </p>
      {blockReason && (
        <MessageBox type="warning">
          {blockReason === 'BALANCE_NOT_EMPTY' ? (
            <FormattedMessage
              defaultMessage="This account has a balance. Please empty it before converting to an Organization."
              id="convertToOrg.block.balanceNotEmpty"
            />
          ) : blockReason === 'HOSTED' ? (
            <FormattedMessage
              defaultMessage="You must leave your Fiscal Host before converting to an Organization."
              id="convertToOrg.block.hosted"
            />
          ) : null}
        </MessageBox>
      )}
      <Button variant="outline" onClick={() => setIsModalOpen(true)} disabled={Boolean(blockReason)}>
        <FormattedMessage defaultMessage="Convert to Organization" id="convertToOrg.button" />
      </Button>
      <ConvertToOrganizationModal open={isModalOpen} setOpen={setIsModalOpen} collective={account} />
    </div>
  );
}
