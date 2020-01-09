import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Button from '../Button';

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

class EditHostSettings extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { collective } = this.props;

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
            <Plan>
              <PlanName>Single Host Plan</PlanName>
              <PlanFeatures>
                <ul>
                  <li>1 hosted collective</li>
                  <li>Unlimited added funds</li>
                </ul>
              </PlanFeatures>
              <PlanPrice>$10 / month</PlanPrice>

              {/* Local
              <Button href={`/opencollective/contribute/single-host-plan-2808/checkout?redirect=${redirectUrl}`}>
                Upgrade
              </Button> */}

              {/* Staging */}
              <Button href={`/opencollective/contribute/single-host-plan-14966/checkout?redirect=${redirectUrl}`}>
                Upgrade
              </Button>
            </Plan>

            <Plan>
              <PlanName>Small Host Plan</PlanName>
              <PlanFeatures>
                <ul>
                  <li>Up to 5 hosted collectives</li>
                  <li>Unlimited added funds</li>
                  <li>Manual bank transfers</li>
                  <li>Host dashboard</li>
                </ul>
              </PlanFeatures>
              <PlanPrice>$25 / month</PlanPrice>

              {/* Local
              <Button href={`/opencollective/contribute/small-host-plan-2809/checkout?redirect=${redirectUrl}`}>
                Upgrade
              </Button>*/}

              {/* Staging */}
              <Button href={`/opencollective/contribute/small-host-plan-14968/checkout?redirect=${redirectUrl}`}>
                Upgrade
              </Button>
            </Plan>

            <Plan>
              <PlanName>Medium Host Plan</PlanName>
              <PlanFeatures>
                <ul>
                  <li>Up to 10 hosted collectives</li>
                  <li>Unlimited added funds</li>
                  <li>Manual bank transfers</li>
                  <li>Host dashboard</li>
                </ul>
              </PlanFeatures>
              <PlanPrice>$50 / month</PlanPrice>

              {/* Staging */}
              <Button href={`/opencollective/contribute/medium-host-plan-14969/checkout?redirect=${redirectUrl}`}>
                Upgrade
              </Button>
            </Plan>

            <Plan>
              <PlanName>Large Host Plan</PlanName>
              <PlanFeatures>
                <ul>
                  <li>Up to 25 hosted collectives</li>
                  <li>Unlimited added funds</li>
                  <li>Manual bank transfers</li>
                  <li>Host dashboard</li>
                </ul>
              </PlanFeatures>
              <PlanPrice>$100 / month</PlanPrice>

              {/* Staging */}
              <Button href={`/opencollective/contribute/large-host-plan-14967/checkout?redirect=${redirectUrl}`}>
                Upgrade
              </Button>
            </Plan>

            <Plan>
              <PlanName>Network Host Plan</PlanName>
              <PlanFeatures>
                <ul>
                  <li>Unlimited hosted collectives</li>
                  <li>Unlimited added funds</li>
                  <li>Manual bank transfers</li>
                  <li>Host dashboard</li>
                </ul>
              </PlanFeatures>
              <PlanPrice>$100+ / month</PlanPrice>
              <Button disabled>Contact Us</Button>
            </Plan>
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
  }
}

export default EditHostSettings;
