import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import dynamic from 'next/dynamic';

import Container from './Container';
import StyledButton from './StyledButton';
import Link from './Link';

// Dynamic imports
const ApplyToHostBtn = dynamic(() => import(/* webpackChunkName: 'ApplyToHostBtn' */ './ApplyToHostBtn'));

/**
 * Show call to actions as buttons for the collective.
 */
const CollectiveCallsToAction = ({
  collective,
  buttonsMinWidth,
  callsToAction: { hasSubmitExpense, hasContact, hasApply, hasDashboard, hasManageSubscriptions },
  ...props
}) => {
  return (
    <Container display="flex" justifyContent="center" alignItems="center" whiteSpace="nowrap" {...props}>
      {hasContact && (
        <a href={`mailto:hello@${collective.slug}.opencollective.com`}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </StyledButton>
        </a>
      )}
      {hasSubmitExpense && (
        <Link route="createExpense" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth} buttonStyle="secondary">
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </StyledButton>
        </Link>
      )}
      {hasManageSubscriptions && (
        <Link route="subscriptions" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
          </StyledButton>
        </Link>
      )}
      {hasDashboard && (
        <Link route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
          </StyledButton>
        </Link>
      )}
      {hasApply && <ApplyToHostBtn host={collective} showConditions={false} />}
    </Container>
  );
};

CollectiveCallsToAction.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  callsToAction: PropTypes.shape({
    /** Button to contact the collective */
    hasContact: PropTypes.bool,
    /** Submit new expense button */
    hasSubmitExpense: PropTypes.bool,
    /** Hosts "Apply" button */
    hasApply: PropTypes.bool,
    /** Hosts "Dashboard" button */
    hasDashboard: PropTypes.bool,
    /** Link to edit subscriptions */
    hasManageSubscriptions: PropTypes.bool,
  }).isRequired,
  /** Will apply a min-width to all buttons */
  buttonsMinWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

CollectiveCallsToAction.defaultProps = {
  callsToAction: {},
};

export default CollectiveCallsToAction;
