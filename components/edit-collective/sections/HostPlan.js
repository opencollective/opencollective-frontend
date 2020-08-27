import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

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

const editCollectiveHostPlansQuery = gql`
  query EditCollectiveHostPlans($slug: String) {
    Collective(slug: $slug) {
      id
      slug
      tiers {
        id
        slug
        type
        name
        data
        description
        longDescription
        hasLongDescription
        button
        amount
        amountType
        minimumAmount
        presets
        interval
        currency
        maxQuantity
      }
    }
  }
`;

const HostPlan = props => {
  const { collective } = props;
  const { data: opencollective, loading } = useQuery(editCollectiveHostPlansQuery, {
    variables: { slug: 'opencollective' },
  });

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
        <Plan active={collective.plan.name === 'default'}>
          <PlanName>Free Plan</PlanName>
          <PlanFeatures>
            <ul>
              <li>
                <FormattedMessage id="Host.Plan.Collectives.unlimited" defaultMessage="Unlimited hosted collectives" />
              </li>
              <li>
                <FormattedMessage id="Host.Plan.AddedFunds.limited" defaultMessage="Up to $1000 added funds" />
                <br />
                (<FormattedMessage id="Host.Plan.acrossCollectives" defaultMessage="across all collectives" />)
              </li>
              <li>
                <FormattedMessage id="Host.Plan.BankTransfers.limited" defaultMessage="Up to $1000 bank transfers" />
                <br />
                (<FormattedMessage id="Host.Plan.acrossCollectives" defaultMessage="across all collectives" />)
              </li>
              <li>
                <FormattedMessage
                  id="Host.Plan.TransferwisePayouts.limited"
                  defaultMessage="Up to $1000 in payouts with TransferWise"
                />
                <br />
                (<FormattedMessage id="Host.Plan.acrossCollectives" defaultMessage="across all collectives" />)
              </li>
            </ul>
          </PlanFeatures>
          <PlanPrice>Free</PlanPrice>
        </Plan>
        {tiers.map(tier => {
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
          <PlanName>Network Host Plan</PlanName>
          <PlanFeatures>
            <ul>
              <li>
                <FormattedMessage
                  id="Host.Plan.Collectives.more"
                  values={{ n: 25 }}
                  defaultMessage="More than {n} collectives"
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
          <Button href="mailto:support@opencollective.com">Contact</Button>
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
      </ul>
    </div>
  );
};

HostPlan.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default HostPlan;
