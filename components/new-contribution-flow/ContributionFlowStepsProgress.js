import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Router } from '../../server/pages';

import { Flex } from '../Grid';
import StepsProgress from '../StepsProgress';
import { Span } from '../Text';

const StepLabel = styled(Span)`
  text-transform: uppercase;
  text-align: center;
`;

StepLabel.defaultProps = {
  color: 'black.400',
  fontSize: 'Tiny',
  mt: 1,
};

const STEP_ONE = 'Contribution';
const STEP_TWO = 'Contribute as';
const STEP_THREE = 'Payment info';

const steps = [
  { name: STEP_ONE, routerStep: 'details' },
  { name: STEP_TWO, routerStep: 'profile' },
  { name: STEP_THREE, routerStep: 'payment' },
];

class NewContributionFlowStepsProgress extends React.Component {
  static propTypes = {
    router: PropTypes.object,
  };

  getFocus = step => {
    switch (step) {
      case 'details':
        return steps[0];
      case 'profile':
        return steps[1];
      case 'payment':
        return steps[2];
      default:
        return steps[0];
    }
  };

  render() {
    const { router } = this.props;

    return (
      <Fragment>
        <StepsProgress
          steps={steps}
          focus={this.getFocus(router.query.step)}
          onStepSelect={step => {
            Router.pushRoute('new-contribute', {
              slug: router.query.slug,
              verb: router.query.verb,
              tier: router.query.tier,
              step: step.routerStep,
            });
          }}
        >
          {({ step }) => {
            let label = null;
            if (step.name === STEP_ONE) {
              label = <FormattedMessage id="NewContributionFlow.step.contribution" defaultMessage={STEP_ONE} />;
            }
            if (step.name === STEP_TWO) {
              label = <FormattedMessage id="contribute.step.contributeAs" defaultMessage={STEP_TWO} />;
            }
            if (step.name === STEP_THREE) {
              label = <FormattedMessage id="contribute.step.payment" defaultMessage={STEP_THREE} />;
            }
            return (
              <Flex flexDirection="column" alignItems="center">
                <StepLabel>{label}</StepLabel>
              </Flex>
            );
          }}
        </StepsProgress>
      </Fragment>
    );
  }
}

export default withRouter(NewContributionFlowStepsProgress);
