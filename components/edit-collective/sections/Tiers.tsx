import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V1_CONTEXT } from '../../../lib/graphql/helpers';
import { collectiveSettingsQuery } from '../../../lib/graphql/v1/queries';
import { sortTiersForCollective, TIERS_ORDER_KEY } from '../../../lib/tier-utils';
import { EMPTY_ARRAY } from '@/lib/constants/utils';

import AdminContributeCardsContainer from '../../contribute-cards/AdminContributeCardsContainer';
import ContributeCustom from '../../contribute-cards/ContributeCustom';
import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Flex, Grid } from '../../Grid';
import Image from '../../Image';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledCheckbox from '../../StyledCheckbox';
import StyledHr from '../../StyledHr';
import StyledLink from '../../StyledLink';
import { P, Span, Strong } from '../../Text';
import { editAccountSettingsMutation } from '../mutations';
import { listTierQuery } from '../tiers/EditTierModal';

const getSortedContributeCards = (collective, tiers, intl) => {
  const sortedTiers = sortTiersForCollective(collective, tiers);
  return sortedTiers.map(tier => {
    if (tier === 'custom') {
      return {
        key: 'custom',
        Component: ContributeCustom,
        componentProps: {
          collective,
          hideContributors: true,
          hideCTA: true,
          missingCTAMsg: intl.formatMessage({
            defaultMessage: 'The default contribution tier cannot be edited.',
            id: 'setJlw',
          }),
        },
      };
    } else {
      return {
        key: tier.legacyId,
        Component: ContributeTier,
        componentProps: {
          collective,
          tier,
          hideContributors: true,
          hideCTA: true,
        },
      };
    }
  });
};

const CardsContainer = styled(Flex).attrs({
  flexWrap: 'wrap',
  gap: '40px',
  justifyContent: 'flex-start',
})`
  & > * {
    padding: 0;
    min-width: 280px;
    flex: 0 1 auto;
  }
`;

/**
 * A revamp of `components/edit-collective/sections/Tiers.js`. Meant to be renamed once we'll be ready
 * to replace the old tiers form.
 */
const Tiers = ({ collective }) => {
  const [draggingId, setDraggingId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const variables = { accountSlug: collective.slug };
  const { data, loading, error: queryError, refetch } = useQuery(listTierQuery, { variables });
  const [editAccountSettings, { loading: isSubmitting }] = useMutation(editAccountSettingsMutation);
  const intl = useIntl();
  const tiers = get(data, 'account.tiers.nodes', EMPTY_ARRAY);
  const contributeCards = React.useMemo(
    () => getSortedContributeCards(collective, tiers, intl),
    [collective, tiers, intl],
  );

  const onTiersReorder = async cards => {
    const cardKeys = cards.map(c => c.key);

    setError(null);
    try {
      await editAccountSettings({
        variables: {
          account: { legacyId: collective.id },
          key: TIERS_ORDER_KEY,
          value: cardKeys,
        },
      });
    } catch (e) {
      setError(getErrorFromGraphqlException(e));
    }
  };

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
            <Box mb={4}>
              <P fontSize="14px" lineHeight="20x" mb={3}>
                <FormattedMessage
                  id="tier.defaultContribution.description"
                  defaultMessage="The default contribution tier doesn't enforce any minimum amount or interval. This is the easiest way for people to contribute to your Collective, but it cannot be customized."
                />
              </P>
              <Mutation
                mutation={editAccountSettingsMutation}
                refetchQueries={[
                  { query: collectiveSettingsQuery, context: API_V1_CONTEXT, variables: { slug: collective.slug } },
                ]}
                awaitRefetchQueries
              >
                {(editSettings, { loading }) => (
                  <StyledCheckbox
                    name="custom-contributions"
                    label={intl.formatMessage({
                      id: 'tier.defaultContribution.label',
                      defaultMessage: 'Enable default contribution tier',
                    })}
                    defaultChecked={!get(collective, 'settings.disableCustomContributions', false)}
                    width="auto"
                    isLoading={loading}
                    disabled={isSubmitting}
                    onChange={({ target }) => {
                      editSettings({
                        variables: {
                          account: { legacyId: collective.id },
                          key: 'disableCustomContributions',
                          value: !target.value,
                        },
                      });
                    }}
                  />
                )}
              </Mutation>
            </Box>
            <AdminContributeCardsContainer
              collective={collective}
              cards={contributeCards}
              CardsContainer={CardsContainer as any}
              enableReordering={true}
              onTierUpdate={() => refetch()}
              onReorder={onTiersReorder}
              draggingId={draggingId}
              setDraggingId={setDraggingId}
              isSaving={isSubmitting}
              canEdit
            />
          </div>
        )}
      </Box>
    </div>
  );
};

export default Tiers;
