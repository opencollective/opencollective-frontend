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
          <FormattedMessage id="Host.Plan.Collectives.single" defaultMessage="1 hosted Collective" />
        )}
        {collectiveLimits[plan] > 1 && (
          <FormattedMessage
            id="Host.Plan.Collectives.limited"
            values={{ n: collectiveLimits[plan] }}
            defaultMessage="Up to {n} hosted Collectives"
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
        <FormattedMessage id="Host.Plan.TransferwisePayouts.unlimited" defaultMessage="Unlimited payouts" />
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
                defaultMessage="Platform fees will be 15% of Host fees"
              />{' '}
              <StyledTooltip
                content={() => (
                  <FormattedMessage
                    id="newPricing.tab.hostFeeChargeExample"
                    defaultMessage="If your Host fee is 10% and your Collectives bring in $1,000, your Platform fee will be $15. If you host fee is 0%, your Platform fee will be 0."
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
            <FormattedMessage id="Host.Plan.TransferwisePayouts.unlimited" defaultMessage="Unlimited payouts" />
          </li>
          <li>
            <FormattedMessage id="Host.Plan.MinimalRevenue.no" defaultMessage="No minimum revenue." />
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
      hostFeePercent
      platformFeePercent
      plan {
        id
        name
      }
      hostMetrics {
        hostFeeSharePercent
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
      <SettingsTitle contentOnly={props.contentOnly}>
        <FormattedMessage id="Host.Plan" defaultMessage="Host Plan" />
      </SettingsTitle>

      <PlanGrid>
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
                <FormattedMessage id="Host.Plan.TransferwisePayouts.unlimited" defaultMessage="Unlimited payouts" />
              </li>
              <li>
                <FormattedMessage
                  id="newPricingTable.row.minimumRaised"
                  defaultMessage="> {minimumRaised} total processed"
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
  contentOnly: PropTypes.bool,
};

export default HostPlan;
