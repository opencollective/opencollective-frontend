import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import dynamic from 'next/dynamic';

import { Mail } from 'styled-icons/feather/Mail';
import { FileText as ExpenseIcon } from 'styled-icons/feather/FileText';

import Container from './Container';
import StyledButton from './StyledButton';
import Link from './Link';
import { Span } from './Text';

// Dynamic imports
const ApplyToHostBtn = dynamic(() => import(/* webpackChunkName: 'ApplyToHostBtn' */ './ApplyToHostBtn'));

/**
 * Show call to actions as buttons for the collective.
 */
const CollectiveCallsToAction = ({
  collective,
  hasSubmitExpense,
  hasContact,
  hasApply,
  hasDashboard,
  hasManageSubscriptions,
  ...props
}) => {
  return (
    <Container display="flex" justifyContent="center" alignItems="center" whiteSpace="nowrap" {...props}>
      {hasContact && (
        <a href={`mailto:hello@${collective.slug}.opencollective.com`}>
          <StyledButton mx={2}>
            <Span mr="5px">
              <Mail size="1.1em" style={{ verticalAlign: 'sub' }} />
            </Span>
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </StyledButton>
        </a>
      )}
      {hasSubmitExpense && (
        <Link route="createExpense" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mx={2}>
            <Span mr="5px">
              <ExpenseIcon size="1.5em" />
            </Span>
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </StyledButton>
        </Link>
      )}
      {hasManageSubscriptions && (
        <Link route="subscriptions" params={{ collectiveSlug: collective.slug }}>
          <StyledButton mx={2}>
            <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
          </StyledButton>
        </Link>
      )}
      {hasDashboard && (
        <Link route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
          <StyledButton mx={2}>
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
  hasContact: PropTypes.bool,
  hasSubmitExpense: PropTypes.bool,
  /** Hosts "Apply" button */
  hasApply: PropTypes.bool,
  /** Hosts "Dashboard" button */
  hasDashboard: PropTypes.bool,
  /** Link to edit subscriptions */
  hasManageSubscriptions: PropTypes.bool,
};

export default CollectiveCallsToAction;
