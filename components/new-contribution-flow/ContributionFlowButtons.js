import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { Flex } from '../../components/Grid';
import Link from '../../components/Link';
import StyledButton from '../../components/StyledButton';

class NewContributionFlowButtons extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
    collectiveSlug: PropTypes.string,
    router: PropTypes.object,
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      next: {
        id: 'contribute.nextStep',
        defaultMessage: 'Next step',
      },
      makeContribution: {
        id: 'contribute.submit',
        defaultMessage: 'Make contribution',
      },
      joinAndGoNext: {
        id: 'NewContributionFlow.JoinAndGoNext',
        defaultMessage: 'Join and go next',
      },
    });
  }

  getNextStep = step => {
    switch (step) {
      case 'details':
        return 'profile';
      case 'profile':
        return 'payment';
      case 'payment':
        return 'success';
    }
  };

  getPrevStep = step => {
    switch (step) {
      case 'profile':
        return 'details';
      case 'payment':
        return 'profile';
    }
  };

  renderButtons = step => {
    let prevLinkRoute, prevLinkParams, nextLinkRoute, nextLinkParams, nextButton;
    const recurringContributionLoggedOut = !this.props.LoggedInUser && this.props.router.query.frequency;

    // to-do: add query strings to params if they are present (frequency, amount, etc)
    switch (step) {
      case 'details':
        {
          prevLinkRoute = 'collective';
          prevLinkParams = { slug: this.props.collectiveSlug };
          nextLinkRoute = this.props.router.query.verb;
          nextLinkParams = {
            slug: this.props.collectiveSlug,
            verb: this.props.router.query.verb,
            tier: this.props.router.query.tier || null,
            step: this.getNextStep(this.props.router.query.step),
          };
          nextButton = this.props.intl.formatMessage(this.messages.next);
        }
        break;
      case 'profile':
        {
          prevLinkRoute = this.props.router.query.verb;
          prevLinkParams = {
            slug: this.props.collectiveSlug,
            verb: this.props.router.query.verb,
            tier: this.props.router.query.tier || null,
            step: this.getPrevStep(this.props.router.query.step),
          };
          nextLinkRoute = this.props.router.query.verb;
          nextLinkParams = {
            slug: this.props.collectiveSlug,
            verb: this.props.router.query.verb,
            tier: this.props.router.query.tier || null,
            step: this.getNextStep(this.props.router.query.step),
          };
          nextButton = recurringContributionLoggedOut
            ? this.props.intl.formatMessage(this.messages.joinAndGoNext)
            : this.props.intl.formatMessage(this.messages.next);
        }
        break;
      case 'payment': {
        prevLinkRoute = this.props.router.query.verb;
        prevLinkParams = {
          slug: this.props.collectiveSlug,
          verb: this.props.router.query.verb,
          tier: this.props.router.query.tier || null,
          step: this.getPrevStep(this.props.router.query.step),
        };
        nextLinkRoute = this.props.router.query.verb;
        nextLinkParams = {
          slug: this.props.collectiveSlug,
          verb: this.props.router.query.verb,
          tier: this.props.router.query.tier || null,
          step: this.getNextStep(this.props.router.query.step),
        };
        nextButton = this.props.intl.formatMessage(this.messages.makeContribution);
      }
    }

    return (
      <Fragment>
        <Link route={prevLinkRoute} params={prevLinkParams}>
          <StyledButton fontSize="13px" minWidth={'85px'} minHeight="36px">
            &larr; <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
          </StyledButton>
        </Link>
        <Link route={nextLinkRoute} params={nextLinkParams}>
          <StyledButton fontSize="13px" minWidth={'85px'} minHeight="36px" ml={2} buttonStyle="primary">
            {nextButton} &rarr;
          </StyledButton>
        </Link>
      </Fragment>
    );
  };

  render() {
    const { router } = this.props;
    const { step } = router.query;

    return (
      <Flex justifyContent={'center'} mt={3}>
        {this.renderButtons(step)}
      </Flex>
    );
  }
}

export default injectIntl(withRouter(NewContributionFlowButtons));
