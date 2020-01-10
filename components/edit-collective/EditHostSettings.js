import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useQuery } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Button from '../Button';
import { getCollectiveQuery } from '../../lib/graphql/queries';

const Capitalized = styled.span`
  text-transform: capitalize;
`;

const Table = styled.table`
  width: 100%;
`;

const Plan = styled.td`
  font-size: 1.2rem;
  text-align: center;
  width: 20%;
`;

const PlanFeatures = styled.p`
  font-size: 1.1rem;
  text-align: center;
  min-height: 13rem;
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

const EditHostSettings = props => {
  const { collective } = props;
  const { data: opencollective } = useQuery(getCollectiveQuery, {
    variables: { slug: 'opencollective' },
  });

  const tiers = get(opencollective, 'Collective.tiers') || [];
  const redirectUrl = `${process.env.WEBSITE_URL}/${collective.slug}/edit/hostSettings`;

  return (
    <div className="ExportData">
      <h2>
        <FormattedMessage id="collective.hostSettings.title" defaultMessage="Host Settings" />
      </h2>

      <h3>
        <FormattedMessage id="collective.hostSettings.changePlan.title" defaultMessage="Plans" />
      </h3>

      <Table>
        <tr>
          {tiers.map(tier => {
            return (
              <Plan key={tier.id}>
                <PlanName>{tier.name}</PlanName>
                <PlanFeatures>{tier.description}</PlanFeatures>
                <PlanPrice>
                  ${tier.amount / 100} / {tier.interval}
                </PlanPrice>
                <Button
                  href={`/opencollective/contribute/${tier.slug}-${tier.id}/checkout?contributeAs=${collective.slug}&redirect=${redirectUrl}`}
                >
                  Upgrade
                </Button>
              </Plan>
            );
          })}
        </tr>
      </Table>

      <h3>
        <FormattedMessage id="collective.hostSettings.currentPlan.title" defaultMessage="Current Plan Usage" />
      </h3>

      <ul>
        <li>
          <strong>Current Plan</strong>: <Capitalized>{collective.plan.name}</Capitalized>
        </li>
        <li>
          <strong>Collective Limit</strong>: {collective.plan.hostedCollectives} of{' '}
          {collective.plan.hostedCollectivesLimit}
        </li>
        <li>
          <strong>Added Funds Limit</strong>:&nbsp;
          {collective.plan.addedFundsLimit && (
            <span>
              ${collective.plan.addedFunds / 100} of ${collective.plan.addedFundsLimit / 100}
            </span>
          )}
          {!collective.plan.addedFundsLimit && (
            <FormattedMessage id="collective.hostSettings.addedFunds.unlimited" defaultMessage="Unlimited" />
          )}
        </li>
        <li>
          <strong>Host Dashboard</strong>: {collective.plan.hostDashboard ? 'Yes' : 'No'}
        </li>
      </ul>
    </div>
  );
};

EditHostSettings.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default EditHostSettings;
