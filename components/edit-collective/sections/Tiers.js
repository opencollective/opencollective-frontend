import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { collectiveSettingsQuery } from '../../../lib/graphql/v1/queries';
import { sortTiersForCollective } from '../../../lib/tier-utils';

import AdminContributeCardsContainer from '../../contribute-cards/AdminContributeCardsContainer';
import ContributeCustom from '../../contribute-cards/ContributeCustom';
import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Grid } from '../../Grid';
import Image from '../../Image';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledCheckbox from '../../StyledCheckbox';
import StyledHr from '../../StyledHr';
import StyledLink from '../../StyledLink';
import { P, Span, Strong } from '../../Text';
import { editAccountSettingsMutation } from '../mutations';
import { listTierQuery } from '../tiers/EditTierModal';

const getSortedContributeCards = (collective, tiers, intl) => {
  const sortedTiers = sortTiersForCollective(collective, tiers);

  const sortedContributeCards = sortedTiers.map(tier =>
    tier === 'custom'
      ? {
          key: 'custom',
          Component: ContributeCustom,
          componentProps: {
            collective,
            hideContributors: true,
            hideCTA: true,
            missingCTAMsg: intl.formatMessage({ defaultMessage: 'The default contribution tier cannot be edited.' }),
          },
        }
      : {
          key: tier.id,
          Component: ContributeTier,
          componentProps: {
            collective,
            tier,
            hideContributors: true,
            hideCTA: true,
          },
        },
  );

  return sortedContributeCards;
};

const CardsContainer = styled(Grid).attrs({
  justifyItems: 'center',
  gridGap: '30px',
  gridTemplateColumns: ['repeat(auto-fit, minmax(280px, 1fr))'],
  gridAutoRows: ['1fr'],
})`
  & > * {
    padding: 0;
  }
`;

/**
 * A revamp of `components/edit-collective/sections/Tiers.js`. Meant to be renamed once we'll be ready
 * to replace the old tiers form.
 */
const Tiers = ({ collective, isLegacyOCFDuplicatedAccount }) => {
  const variables = { accountSlug: collective.slug };
  const { data, loading, error, refetch } = useQuery(listTierQuery, { variables, context: API_V2_CONTEXT });
  const intl = useIntl();
  const tiers = get(data, 'account.tiers.nodes', []);
  return (
    <div>
      <Grid gridTemplateColumns={['1fr', '172px 1fr']} gridGap={62} mt={34}>
        <Box>
          <Image src="/static/images/tiers-graphic.png" alt="" width={172} height={145} />
        </Box>
        <Box ml={2}>
          <P>
            <Strong>
              <FormattedMessage defaultMessage="About contribution tiers" />
            </Strong>
            <br />
            <br />
            <Span>
              <FormattedMessage defaultMessage="You can provide perks or rewards for your tiers, have a set membership fee, or create categories for your contributors. Tiers can be limited to an amount or frequency (one time, monthly, yearly), or allowed to be flexibly set by contributors." />
            </Span>
          </P>
          <P mt={3}>
            <StyledLink
              href="https://docs.opencollective.com/help/collectives/collective-settings/tiers-goals"
              openInNewTab
            >
              <FormattedMessage defaultMessage="Learn more about tiers" />.
            </StyledLink>
          </P>
        </Box>
      </Grid>
      <StyledHr my={4} borderColor="black.300" />

      {isLegacyOCFDuplicatedAccount && (
        <MessageBox type="error" my={4}>
          <div className="flex items-center gap-4">
            <Image src="/static/images/illustrations/signs.png" alt="" width={32} height={32} />
            <div>
              <p>You can’t make any changes to the tiers since this is a limited account.</p>
              <p>
                <StyledLink href="https://blog.opencollective.com/fiscal-host-transition/" openInNewTab>
                  Learn more
                </StyledLink>
              </p>
            </div>
          </div>
        </MessageBox>
      )}

      <Box my={4}>
        {loading ? (
          <LoadingPlaceholder height={500} width="100%" />
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <div className={isLegacyOCFDuplicatedAccount ? 'pointer-events-none opacity-50 grayscale' : ''}>
            <Box mb={4}>
              <P fontSize="14px" lineHeight="20x" mb={3}>
                <FormattedMessage
                  id="tier.defaultContribution.description"
                  defaultMessage="The default contribution tier doesn't enforce any minimum amount or interval. This is the easiest way for people to contribute to your Collective, but it cannot be customized."
                />
              </P>
              <Mutation
                mutation={editAccountSettingsMutation}
                refetchQueries={[{ query: collectiveSettingsQuery, variables: { slug: collective.slug } }]}
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
                    onChange={({ target }) => {
                      editSettings({
                        variables: {
                          account: { legacyId: collective.id },
                          key: 'disableCustomContributions',
                          value: !target.value,
                        },
                        context: API_V2_CONTEXT,
                      });
                    }}
                  />
                )}
              </Mutation>
            </Box>
            <AdminContributeCardsContainer
              collective={collective}
              cards={getSortedContributeCards(collective, tiers, intl)}
              CardsContainer={CardsContainer}
              useTierModals
              enableReordering={false}
              onTierUpdate={() => refetch()}
            />
          </div>
        )}
      </Box>
    </div>
  );
};

Tiers.propTypes = {
  isLegacyOCFDuplicatedAccount: PropTypes.bool,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
  }).isRequired,
};

export default Tiers;
