import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import dynamic from 'next/dynamic';
import { get } from 'lodash';

import Container from './Container';
import StyledButton from './StyledButton';
import StyledTooltip from './StyledTooltip';
import Link from './Link';
import _ApplyToHostBtn from './ApplyToHostBtn';

// Dynamic imports
const AddFundsModal = dynamic(() => import('./AddFundsModal'));

/**
 * Show call to actions as buttons for the collective.
 */
const CollectiveCallsToAction = ({
  collective,
  buttonsMinWidth,
  callsToAction: { hasSubmitExpense, hasContact, hasApply, hasDashboard, hasManageSubscriptions, addFunds },
  ...props
}) => {
  const [hasAddFundsModal, showAddFundsModal] = React.useState(false);
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;

  const ApplyToHostBtn = () => (
    <_ApplyToHostBtn host={collective} disabled={!hostWithinLimit} showConditions={false} minWidth={buttonsMinWidth} />
  );

  return (
    <Container display="flex" justifyContent="center" alignItems="center" whiteSpace="nowrap" {...props}>
      {hasContact && (
        <Link route="collective-contact" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </StyledButton>
        </Link>
      )}
      {hasSubmitExpense && (
        <Link route="createExpense" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth} buttonStyle="secondary" data-cy="submit-expense-btn">
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
      {hasDashboard && collective.plan.hostDashboard && (
        <Link route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth}>
            <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
          </StyledButton>
        </Link>
      )}
      {hasApply && (
        <Box mx={2} my={1}>
          {hostWithinLimit ? (
            <ApplyToHostBtn />
          ) : (
            <StyledTooltip
              type="light"
              content={
                <FormattedMessage
                  id="host.hostLimit.warning"
                  defaultMessage="Host already reached the limit of hosted collectives for its plan."
                />
              }
            >
              <ApplyToHostBtn />
            </StyledTooltip>
          )}
        </Box>
      )}
      {addFunds && (
        <Fragment>
          <StyledButton mx={2} my={1} minWidth={buttonsMinWidth} onClick={() => showAddFundsModal(true)}>
            <FormattedMessage id="menu.addFunds" defaultMessage="Add funds" />
          </StyledButton>
          <AddFundsModal collective={collective} show={hasAddFundsModal} setShow={showAddFundsModal} />
        </Fragment>
      )}
    </Container>
  );
};

CollectiveCallsToAction.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    plan: PropTypes.object,
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
    /** Link to add funds */
    addFunds: PropTypes.bool,
  }).isRequired,
  /** Will apply a min-width to all buttons */
  buttonsMinWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

CollectiveCallsToAction.defaultProps = {
  callsToAction: {},
  buttonsMinWidth: 100,
};

export default CollectiveCallsToAction;
