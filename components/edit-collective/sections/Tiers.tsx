import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { get } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import type { Tier } from '../../../lib/graphql/types/v2/schema';
import { sortTiersForCollective, TIERS_ORDER_KEY } from '../../../lib/tier-utils';
import { EMPTY_ARRAY } from '@/lib/constants/utils';

import { Box, Grid } from '../../Grid';
import Image from '../../Image';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledHr from '../../StyledHr';
import StyledLink from '../../StyledLink';
import { P, Span, Strong } from '../../Text';
import { Button } from '../../ui/Button';
import { editAccountSettingsMutation } from '../mutations';
import { useTierActions } from '../tiers/actions';
import { listTierQuery } from '../tiers/EditTierModal';
import TiersTable from '../TiersTable';

type TierRow = Tier | { id: 'custom'; type: 'CUSTOM'; name: string; description?: string };

/**
 * A revamp of `components/edit-collective/sections/Tiers.js`. Meant to be renamed once we'll be ready
 * to replace the old tiers form.
 */
const Tiers = ({ collective }) => {
  const [error, setError] = React.useState(null);

  const variables = { accountSlug: collective.slug };
  const { data, loading, error: queryError, refetch } = useQuery(listTierQuery, { variables, context: API_V2_CONTEXT });
  const [editAccountSettings, { loading: isSubmitting }] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  }); // Still needed for handleToggleCustomContribution

  const tiers = get(data, 'account.tiers.nodes', EMPTY_ARRAY);
  const sortedTiers = sortTiersForCollective(collective, tiers, true);
  const hasCustomContribution = !get(collective, 'settings.disableCustomContributions', false);

  // Transform sorted tiers to table rows, including custom contribution
  const tableData: TierRow[] = React.useMemo(() => {
    const rows: TierRow[] = [];
    sortedTiers.forEach(tier => {
      if (tier === 'custom') {
        rows.push({ id: 'custom', type: 'CUSTOM', name: 'Donation' });
      } else {
        rows.push(tier);
      }
    });
    return rows;
  }, [sortedTiers]);

  const { getActions, handleEdit } = useTierActions({
    tiersOrderKey: TIERS_ORDER_KEY,
    data: tableData,
    collectiveId: collective.id,
    isCustomContributionEnabled: hasCustomContribution,
    refetch,
    setError,
    collective,
  });

  return (
    <div>
      <Grid gridTemplateColumns={['1fr', '172px 1fr']} gridGap={62} mt={34}>
        <Box>
          <Image src="/static/images/tiers-graphic.png" alt="" width={172} height={145} />
        </Box>
        <Box ml={2}>
          <P>
            <Strong>
              <FormattedMessage defaultMessage="About contribution tiers" id="RHApk3" />
            </Strong>
            <br />
            <br />
            <Span>
              <FormattedMessage
                defaultMessage="You can provide perks or rewards for your tiers, have a set membership fee, or create categories for your contributors. Tiers can be limited to an amount or frequency (one time, monthly, yearly), or allowed to be flexibly set by contributors."
                id="LdgLV7"
              />
            </Span>
          </P>
          <P mt={3}>
            <StyledLink
              href="https://documentation.opencollective.com/collectives/raising-money/setting-goals-and-tiers"
              openInNewTab
            >
              <FormattedMessage defaultMessage="Learn more about tiers" id="108gPp" />.
            </StyledLink>
          </P>
        </Box>
      </Grid>
      <StyledHr my={4} borderColor="black.300" />

      <Box my={4}>
        {loading ? (
          <LoadingPlaceholder height={500} width="100%" />
        ) : queryError ? (
          <MessageBoxGraphqlError error={queryError} />
        ) : (
          <div>
            {error && <MessageBoxGraphqlError mb={5} error={error} />}
            <div className="mb-4 flex justify-end">
              <Button
                data-cy="create-contribute-tier"
                className="gap-1"
                size="sm"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleEdit(null)}
              >
                <span>
                  <FormattedMessage id="Contribute.CreateTier" defaultMessage="Create Contribution Tier" />
                </span>
                <PlusIcon size={20} />
              </Button>
            </div>
            <TiersTable
              data={tableData}
              collective={collective}
              loading={isSubmitting}
              getActions={getActions}
              emptyMessage={() => (
                <FormattedMessage defaultMessage="No tiers yet. Create your first contribution tier!" id="NoTiersYet" />
              )}
            />
          </div>
        )}
      </Box>
    </div>
  );
};

export default Tiers;
