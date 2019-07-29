import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Mail } from 'styled-icons/feather/Mail';
import { FileText as ExpenseIcon } from 'styled-icons/feather/FileText';

import Container from './Container';
import StyledButton from './StyledButton';
import Link from './Link';
import { Span } from './Text';

/**
 * Show call to actions as buttons for the collective.
 */
const CollectiveCallsToAction = ({ collectiveSlug, hasSubmitExpense, hasContact, ...props }) => {
  return (
    <Container display="flex" justifyContent="center" alignItems="center" whiteSpace="nowrap" {...props}>
      {hasContact && (
        <a href={`mailto:hello@${collectiveSlug}.opencollective.com`}>
          <StyledButton mx={2}>
            <Span mr="5px">
              <Mail size="1.1em" style={{ verticalAlign: 'sub' }} />
            </Span>
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </StyledButton>
        </a>
      )}
      {hasSubmitExpense && (
        <Link route="createExpense" params={{ collectiveSlug }}>
          <StyledButton mx={2}>
            <Span mr="5px">
              <ExpenseIcon size="1.5em" />
            </Span>
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </StyledButton>
        </Link>
      )}
    </Container>
  );
};

CollectiveCallsToAction.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  hasContact: PropTypes.bool,
  hasSubmitExpense: PropTypes.bool,
};

export default CollectiveCallsToAction;
