import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { editCollectivePageQuery } from '../../../lib/graphql/queries';

import StyledButton from '../../StyledButton';
import StyledTooltip from '../../StyledTooltip';
import SettingsTitle from '../SettingsTitle';

import SettingsSectionTitle from './SettingsSectionTitle';

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
            <FormattedMessage id="Host.Plan.PlatformTips.yes" defaultMessage="Voluntary Platform Tips" />
          </li>
          {hostFees && (
            <li>
              <FormattedMessage id="Host.Plan.HostFees.yes" defaultMessage="Configurable Host Fee" />
              .&nbsp;
              <FormattedMessage
                id="Host.Plan.RevenueCharge.yes"
                defaultMessage="15% charge on revenue made through it"
              />{' '}
              <StyledTooltip
                content={() => (
                  <FormattedMessage
                    id="newPricing.tab.hostFeeChargeExample"
                    defaultMessage="If your host fee is 10% and your Collectives bring in $1,000, your revenue is $100 and from it you’ll pay $15 to the platform."
                  />
                )}
              >
                <LimitsInfoCircle size={12} />
              </StyledTooltip>
            </li>
          )}
          {!hostFees && (
            <li>
              <FormattedMessage id="Host.Plan.HostFees.no" defaultMessage="0% Host Fee (not configurable)" />
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
          <li>
            <FormattedMessage id="Host.Plan.MinimalRevenue.no" defaultMessage="No minimal revenue." />
          </li>
        </ul>
      </PlanFeatures>
      <StyledButton
        disabled={loading || collective.plan.name === plan}
        onClick={() => editHostPlan({ variables: { account: { slug: collective.slug }, plan: plan } })}
      >
        {loading ? '...' : collective.plan.name === plan ? 'Activated' : 'Activate'}
      </StyledButton>
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

const editHostPlanMutation = gqlV2/* GraphQL */ `
  mutation EditHostPlan($account: AccountReferenceInput!, $plan: String!) {
    editHostPlan(account: $account, plan: $plan) {
      id
      slug
      plan {
        id
        name
      }
    }
  }
`;

const HostPlan = props => {
  const { collective } = props;

  const editHostPlanMutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: editCollectivePageQuery, variables: { slug: collective.slug } }],
    awaitRefetchQueries: true,
  };

  const [editHostPlan, { loading: editHostPlanLoading }] = useMutation(
    editHostPlanMutation,
    editHostPlanMutationOptions,
  );

  return (
    <div>
      <SettingsTitle>
        <FormattedMessage id="Host.Plan" defaultMessage="Host Plan" />
      </SettingsTitle>

      <PlanGrid>
        <Plan active={collective.plan.name === 'default'}>
          <PlanName>Default Plan (old)</PlanName>
          <PlanFeatures>
            <ul>
              <li>
                <FormattedMessage
                  id="Host.Plan.PlatformTips.sometimes"
                  defaultMessage="5% Platform Fees or Platform Tips"
                />
              </li>
              <li>
                <FormattedMessage id="Host.Plan.HostFees.yes" defaultMessage="Configurable Host Fee" />
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
              <li>
                <FormattedMessage id="Host.Plan.MinimalRevenue.no" defaultMessage="No minimal revenue." />
              </li>
            </ul>
          </PlanFeatures>
          <StyledButton disabled={true}>Deprecated</StyledButton>
          {collective.plan.name === 'default' && <DisabledMessage>Current plan.</DisabledMessage>}
        </Plan>

        <NewPlanFeatures
          collective={collective}
          plan="start-plan-2021"
          label="Start Plan"
          hostFees={false}
          editHostPlan={editHostPlan}
          loading={editHostPlanLoading}
        />

        {collective.type === 'ORGANIZATION' && (
          <NewPlanFeatures
            collective={collective}
            plan="grow-plan-2021"
            label="Grow Plan"
            hostFees={true}
            editHostPlan={editHostPlan}
            loading={editHostPlanLoading}
          />
        )}

        <Plan active={collective.plan.name === 'custom'}>
          <PlanName>Custom Host Plan</PlanName>
          <PlanFeatures>
            <ul>
              <li>
                <FormattedMessage id="Host.Plan.PlatformTips.yes" defaultMessage="Voluntary Platform Tips" />
              </li>
              <li>
                <FormattedMessage id="Host.Plan.HostFees.yes" defaultMessage="Configurable Host Fee" />
                .&nbsp;
                <FormattedMessage
                  id="Host.Plan.RevenueCharge.negotiable"
                  defaultMessage="Negotiable revenue sharing model."
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
              <li>
                <FormattedMessage
                  id="newPricingTable.row.minimumRaised"
                  defaultMessage="+ {minimumRaised} total raised"
                  values={{ minimumRaised: '$150,000' }}
                />
              </li>
            </ul>
          </PlanFeatures>
          <StyledButton href="/support">Contact Us</StyledButton>
        </Plan>
      </PlanGrid>

      <SettingsSectionTitle mt={3}>
        <FormattedMessage id="collective.hostSettings.currentPlan.title" defaultMessage="Limits and Usage" />
      </SettingsSectionTitle>

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
          <strong>
            {' '}
            <FormattedMessage id="newPricingTable.row.hostFee" defaultMessage="Ability to configure Host Fee" />
          </strong>{' '}
          : {collective.plan.hostFees && <FormattedMessage id="yes" defaultMessage="Yes" />}
          {!collective.plan.hostFees && <FormattedMessage id="no" defaultMessage="No" />}
        </li>
        <li>
          <strong>Charge on Host Fees</strong> :{' '}
          {collective.plan.hostFeeSharePercent !== 0 && <span>{collective.plan.hostFeeSharePercent}%</span>}
          {collective.plan.hostFeeSharePercent === 0 && <FormattedMessage id="no" defaultMessage="No" />}
        </li>
      </ul>
    </div>
  );
};

HostPlan.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default HostPlan;
