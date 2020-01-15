import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useQuery } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';

import Button from '../Button';
import Loading from '../Loading';
import { getCollectiveTiersDescriptionQuery } from '../../lib/graphql/queries';

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

const PlanFeatures = styled.p`
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

const EditHostSettings = props => {
  const { collective } = props;
  const { data: opencollective, loading } = useQuery(getCollectiveTiersDescriptionQuery, {
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
  const redirectUrl = `${process.env.WEBSITE_URL}/${collective.slug}/edit/hostSettings`;

  return (
    <div className="ExportData">
      <h2>
        <FormattedMessage id="collective.hostSettings.title" defaultMessage="Host Settings" />
      </h2>

      <h3>
        <FormattedMessage id="collective.hostSettings.changePlan.title" defaultMessage="Plans" />
      </h3>

      <PlanGrid>
        <Plan active={collective.plan.name === 'default'}>
          <PlanName>Free Host Plan</PlanName>
          <PlanFeatures>
            <ul>
              <li>Unlimeted hosted collectives</li>
              <li>Up to $1000 added funds across all collectives</li>
            </ul>
          </PlanFeatures>
          <PlanPrice>Free</PlanPrice>
        </Plan>
        {tiers.map(tier => {
          const isCurrentPlan = collective.plan.name === tier.slug;
          const isWithinLimits = tier.data
            ? collective.plan.hostedCollectives <= tier.data.hostedCollectivesLimit
            : true;

          let verb = isCurrentPlan ? 'Subscribed' : 'Subscribe';
          // Rename verb to Upgrade/Downgrade if subscribed to active Tier
          if (subscribedTier && subscribedTier.amount > tier.amount) verb = 'Downgrade';
          else if (subscribedTier && subscribedTier.amount < tier.amount) verb = 'Upgrade';

          return (
            <Plan key={tier.id} disabled={!isWithinLimits && !isCurrentPlan} active={isCurrentPlan}>
              <PlanName>{tier.name}</PlanName>
              <PlanFeatures
                dangerouslySetInnerHTML={{
                  __html: tier.longDescription,
                }}
              />
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
              <li>More than 25 collectives</li>
              <li>Unlimited added funds</li>
              <li>Manual bank transfers</li>
            </ul>
          </PlanFeatures>
          <PlanPrice>Talk to Us</PlanPrice>
          <Button href="mailto:support@opencollective.com">Contact</Button>
        </Plan>
      </PlanGrid>

      <h3>
        <FormattedMessage id="collective.hostSettings.currentPlan.title" defaultMessage="Current Plan Usage" />
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
          <strong>Added Funds Limit</strong>:&nbsp;
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
          <strong>Host Dashboard</strong>: {collective.plan.hostDashboard ? 'Yes' : 'No'}
        </li>
        <li>
          <strong>Manual Payments</strong>: {collective.plan.manualPayments ? 'Yes' : 'No'}
        </li>
      </ul>
    </div>
  );
};

EditHostSettings.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default EditHostSettings;
