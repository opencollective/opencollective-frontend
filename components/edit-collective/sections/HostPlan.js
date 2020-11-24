import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { editCollectivePageQuery } from '../../../lib/graphql/queries';

import Button from '../../Button';
import Loading from '../../Loading';
import StyledTooltip from '../../StyledTooltip';
import { H3 } from '../../Text';

const LimitsInfoCircle = styled(InfoCircle)`
  vertical-align: baseline;
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;

  @media (max-width: ${themeGet('breakpoints.0')}) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
`;

const Plan = styled.div`
  font-size: 1.2rem;
  text-align: center;
  vertical-align: top;
  margin: 20px;
  padding: 10px;
  ${({ disabled }) => (disabled ? 'color: #888;' : '')}
  ${({ active }) => (active ? `border: 1px solid rgb(143, 199, 255); border-radius: 16px; margin: 19px;` : '')}
`;

const PlanFeatures = styled.div`
  font-size: 1.1rem;
  text-align: center;
  min-height: 11rem;
  padding-top: 1rem;
`;

const PlanName = styled.h4`
  font-size: 1.4rem;
  text-align: center;
  font-weight: bold;
`;

const PlanPrice = styled.p`
  font-size: 1.4rem;
  text-align: center;
  font-weight: bold;
`;

const DisabledMessage = styled.p`
  font-size: 1.1rem;
  font-style: italic;
  text-align: center;
`;

const GenericPlanFeatures = ({ plan }) => {
  const collectiveLimits = {
    'single-host-plan': 1,
    'small-host-plan': 5,
    'medium-host-plan': 10,
    'large-host-plan': 25,
  };
  return (
    <ul>
      <li>
        {collectiveLimits[plan] === 1 && (
          <FormattedMessage id="Host.Plan.Collectives.single" defaultMessage="1 hosted collective" />
        )}
        {collectiveLimits[plan] > 1 && (
          <FormattedMessage
            id="Host.Plan.Collectives.limited"
            values={{ n: collectiveLimits[plan] }}
            defaultMessage="Up to {n} hosted collectives"
          />
        )}
      </li>
      <li>
        <FormattedMessage id="Host.Plan.AddedFunds.unlimited" defaultMessage="Unlimited added funds" />
      </li>
      <li>
        <FormattedMessage id="Host.Plan.BankTransfers.unlimited" defaultMessage="Unlimited bank transfers" />
      </li>
      <li>
        <FormattedMessage
          id="Host.Plan.TransferwisePayouts.unlimited"
          defaultMessage="Unlimited payouts with TranferWise"
        />
      </li>
    </ul>
  );
};

GenericPlanFeatures.propTypes = {
  plan: PropTypes.string.isRequired,
};

const NewPlanFeatures = ({ collective, plan, label, loading, editHostPlan, hostFees }) => {
  return (
    <Plan active={collective.plan.name === plan}>
      <PlanName>{label}</PlanName>
      <PlanFeatures>
        <ul>
          <li>
            <FormattedMessage id="Host.Plan.PlatformTips.yes" defaultMessage="Platform Tips" />
          </li>
          {hostFees && (
            <li>
              <FormattedMessage id="Host.Plan.HostFees.yes" defaultMessage="Configurable Host Fees" />
              .&nbsp;
              <FormattedMessage
                id="Host.Plan.RevenueCharge.yes"
                defaultMessage="15% charge on revenue made through it"
              />
            </li>
          )}
          {!hostFees && (
            <li>
              <FormattedMessage id="Host.Plan.HostFees.no" defaultMessage="0% Host Fees (not configurable)" />
            </li>
          )}
          {1 !== 1 && (
            <li>
              <FormattedMessage
                id="Host.Plan.MoneyProcessed.limited"
                values={{ maximumAmount: '$100,000' }}
                defaultMessage="Up to {maximumAmount} in money processed"
              />
            </li>
          )}
          <li>
            <FormattedMessage id="Host.Plan.AddedFunds.unlimited" defaultMessage="Unlimited added funds" />
          </li>
          <li>
            <FormattedMessage id="Host.Plan.BankTransfers.unlimited" defaultMessage="Unlimited bank transfers" />
          </li>
          <li>
            <FormattedMessage
              id="Host.Plan.TransferwisePayouts.unlimited"
              defaultMessage="Unlimited payouts with TranferWise"
            />
          </li>
        </ul>
      </PlanFeatures>
      <PlanPrice>Free</PlanPrice>
      <Button
        disabled={loading || collective.plan.name === plan}
        onClick={() => editHostPlan({ variables: { account: { slug: collective.slug }, plan: plan } })}
      >
        {loading ? '...' : 'Activate'}
      </Button>
      {collective.plan.name === plan && <DisabledMessage>Current plan.</DisabledMessage>}
    </Plan>
  );
};

NewPlanFeatures.propTypes = {
  collective: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  plan: PropTypes.string.isRequired,
  editHostPlan: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  hostFees: PropTypes.bool.isRequired,
};

const editCollectiveHostPlansQuery = gql`
  query EditCollectiveHostPlans($slug: String) {
    Collective(slug: $slug) {
      id
      slug
      tiers {
        id
        slug
        name
        interval
        amount
      }
    }
  }
`;

const editHostPlanMutation = gqlV2/* GraphQL */ `
  mutation EditHostPlan($account: AccountReferenceInput!, $plan: String!) {
    editHostPlan(account: $account, plan: $plan) {
      id
      slug
      plan {
        name
      }
    }
  }
`;

const HostPlan = props => {
  const { collective } = props;
  const { data: opencollective, loading } = useQuery(editCollectiveHostPlansQuery, {
    variables: { slug: 'opencollective' },
  });

  const editHostPlanMutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: editCollectivePageQuery, variables: { slug: collective.slug } }],
    awaitRefetchQueries: true,
  };

  const [editHostPlan, { loading: editHostPlanLoading }] = useMutation(
    editHostPlanMutation,
    editHostPlanMutationOptions,
  );

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  const tiers = get(opencollective, 'Collective.tiers') || [];
  const subscribedTier = tiers.find(tier => tier.slug === collective.plan.name);
  const redirectUrl = `${process.env.WEBSITE_URL}/${collective.slug}/edit/host-plan`;

  return (
    <div>
      <H3>
        <FormattedMessage id="Host.Plan" defaultMessage="Host Plan" />
      </H3>

      <PlanGrid>
        {collective.plan.name !== 'goer' && (
          <Plan active={collective.plan.name === 'default'}>
            <PlanName>Default Plan (old)</PlanName>
            <PlanFeatures>
              <ul>
                <li>
                  <FormattedMessage id="Host.Plan.PlatformTips.no" defaultMessage="5% Platform Fees" />
                </li>
                <li>
                  <FormattedMessage id="Host.Plan.HostFees.yes" defaultMessage="Configurable Host Fees" />
                  .&nbsp;
                  <FormattedMessage
                    id="Host.Plan.RevenueCharge.no"
                    defaultMessage="No charge on revenue made through it."
                  />
                </li>
                <li>
                  <FormattedMessage id="Host.Plan.AddedFunds.limited" defaultMessage="Up to $1000 added funds" />
                </li>
                <li>
                  <FormattedMessage id="Host.Plan.BankTransfers.limited" defaultMessage="Up to $1000 bank transfers" />
                </li>
                <li>
                  <FormattedMessage
                    id="Host.Plan.TransferwisePayouts.limited"
                    defaultMessage="Up to $1000 payouts with TransferWise"
                  />
                </li>
              </ul>
            </PlanFeatures>
            <PlanPrice>Free</PlanPrice>
            <Button
              disabled={editHostPlanLoading || collective.plan.name === 'default'}
              onClick={() => editHostPlan({ variables: { account: { slug: collective.slug }, plan: 'default' } })}
            >
              {editHostPlanLoading ? '...' : 'Activate'}
            </Button>
            {collective.plan.name === 'default' && <DisabledMessage>Current plan.</DisabledMessage>}
          </Plan>
        )}

        {collective.type === 'ORGANIZATION' && (
          <NewPlanFeatures
            collective={collective}
            plan="organization-plan-2021"
            label="Organization Plan (new)"
            hostFees={true}
            editHostPlan={editHostPlan}
            loading={editHostPlanLoading}
          />
        )}

        {collective.type === 'USER' && (
          <NewPlanFeatures
            collective={collective}
            plan="user-plan-2021"
            label="User Plan (new)"
            hostFees={false}
            editHostPlan={editHostPlan}
            loading={editHostPlanLoading}
          />
        )}

        {!['organization-plan-2021', 'user-plan-2021', 'owned', 'custom'].includes(collective.plan) &&
          tiers.map(tier => {
            const isCurrentPlan = collective.plan.name === tier.slug;
            const hostedCollectivesLimit = get(tier, 'data.hostedCollectivesLimit');
            const isWithinLimits = hostedCollectivesLimit
              ? collective.plan.hostedCollectives <= hostedCollectivesLimit
              : true;

            let verb = isCurrentPlan ? 'Subscribed' : 'Subscribe';
            // Rename verb to Upgrade/Downgrade if subscribed to active Tier
            if (subscribedTier && subscribedTier.amount > tier.amount) {
              verb = 'Downgrade';
            } else if (subscribedTier && subscribedTier.amount < tier.amount) {
              verb = 'Upgrade';
            }

            return (
              <Plan key={tier.id} disabled={!isWithinLimits && !isCurrentPlan} active={isCurrentPlan}>
                <PlanName>{tier.name}</PlanName>
                <PlanFeatures>
                  <GenericPlanFeatures plan={tier.slug} />
                </PlanFeatures>
                <PlanPrice>
                  ${tier.amount / 100} / {tier.interval}
                </PlanPrice>
                <Button
                  href={`/opencollective/contribute/${tier.slug}-${tier.id}/checkout?contributeAs=${collective.slug}&redirect=${redirectUrl}`}
                  disabled={!isWithinLimits || isCurrentPlan}
                >
                  {verb}
                </Button>
                {isCurrentPlan && <DisabledMessage>Current plan.</DisabledMessage>}
                {!isWithinLimits && !isCurrentPlan && <DisabledMessage>Current usage is above limits.</DisabledMessage>}
              </Plan>
            );
          })}
        <Plan active={collective.plan.name === 'network-host-plan'}>
          <PlanName>Custom Host Plan</PlanName>
          <PlanFeatures>
            <ul>
              <li>
                <FormattedMessage
                  id="Host.Plan.PlatformTips.disablable"
                  defaultMessage="Platform Tips (if you want to)"
                />
              </li>
              <li>
                <FormattedMessage id="Host.Plan.HostFees.yes" defaultMessage="Configurable Host Fees" />
                .&nbsp;
                <FormattedMessage
                  id="Host.Plan.RevenueCharge.negotiable"
                  defaultMessage="Negotiable charge on revenue made through it."
                />
              </li>
              <li>
                <FormattedMessage id="Host.Plan.AddedFunds.unlimited" defaultMessage="Unlimited added funds" />
              </li>
              <li>
                <FormattedMessage id="Host.Plan.BankTransfers.unlimited" defaultMessage="Unlimited bank transfers" />
              </li>
              <li>
                <FormattedMessage
                  id="Host.Plan.TransferwisePayouts.unlimited"
                  defaultMessage="Unlimited payouts with TranferWise"
                />
              </li>
            </ul>
          </PlanFeatures>
          <PlanPrice>Talk to Us</PlanPrice>
          <Button href="/support">Contact Us</Button>
        </Plan>
      </PlanGrid>

      <h3>
        <FormattedMessage id="collective.hostSettings.currentPlan.title" defaultMessage="Limits and Usage" />
      </h3>

      <ul>
        <li>
          <strong>Current Plan</strong>: {collective.plan.name}
        </li>
        <li>
          <strong>Collective Limit</strong>:&nbsp;
          {collective.plan.hostedCollectivesLimit && (
            <span>
              {collective.plan.hostedCollectives} of {collective.plan.hostedCollectivesLimit}
            </span>
          )}
          {!collective.plan.hostedCollectivesLimit && (
            <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />
          )}
        </li>
        <li>
          <strong>Added Funds Limit</strong>{' '}
          <StyledTooltip
            content={() => (
              <FormattedMessage
                id="collective.hostSettings.help.fundsLimit"
                defaultMessage="The maximum amount of fund added, during any timeframe, across all collectives."
              />
            )}
          >
            <LimitsInfoCircle size={12} />
          </StyledTooltip>
          :{' '}
          {collective.plan.addedFundsLimit && (
            <span>
              ${collective.plan.addedFunds / 100} of ${collective.plan.addedFundsLimit / 100}
            </span>
          )}
          {!collective.plan.addedFundsLimit && (
            <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />
          )}
        </li>
        <li>
          <strong>Bank Transfers Limit</strong>{' '}
          <StyledTooltip
            content={() => (
              <FormattedMessage
                id="collective.hostSettings.help.manualPayments"
                defaultMessage="Your contributors create a pending donation and receive email instructions with your bank details. You can reconcile the donation when you receive it."
              />
            )}
          >
            <LimitsInfoCircle size={12} />
          </StyledTooltip>
          :{' '}
          {collective.plan.bankTransfersLimit && (
            <span>
              ${collective.plan.bankTransfers / 100} of ${collective.plan.bankTransfersLimit / 100}
            </span>
          )}
          {!collective.plan.bankTransfersLimit && (
            <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />
          )}
        </li>
        <li>
          <strong>Payouts with TransferWise Limit</strong>{' '}
          <StyledTooltip
            content={() => (
              <FormattedMessage
                id="collective.hostSettings.help."
                defaultMessage="You can pay expenses with one-click using TransferWise."
              />
            )}
          >
            <LimitsInfoCircle size={12} />
          </StyledTooltip>
          :{' '}
          {collective.plan.transferwisePayoutsLimit && (
            <span>
              ${collective.plan.transferwisePayouts / 100} of ${collective.plan.transferwisePayoutsLimit / 100}
            </span>
          )}
          {!collective.plan.transferwisePayoutsLimit && (
            <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />
          )}
        </li>
        <li>
          <strong>Ability to configure Host Fees</strong> :{' '}
          {collective.plan.hostFees && <FormattedMessage id="yes" defaultMessage="Yes" />}
          {!collective.plan.hostFees && <FormattedMessage id="no" defaultMessage="No" />}
        </li>
        <li>
          <strong>Charge on Host Fees</strong> :{' '}
          {collective.plan.hostFeeChargePercent !== 0 && <span>{collective.plan.hostFeeChargePercent}%</span>}
          {collective.plan.hostFeeChargePercent === 0 && <FormattedMessage id="no" defaultMessage="No" />}
        </li>
      </ul>
    </div>
  );
};

HostPlan.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default HostPlan;
