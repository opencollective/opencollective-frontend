import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { themeGet } from '@styled-system/theme-get';
import { compact, find, first, uniq, upperCase } from 'lodash';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledFilters from '../StyledFilters';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledRoundButton from '../StyledRoundButton';
import StyledTag from '../StyledTag';
import { H1, P } from '../Text';

const SecurityCheckItem = styled(Flex)`
  justify-content: space-between;
  min-height: 72px;
  padding: 12px 16px;
  :not(:last-child) {
    border-bottom: 1px solid ${themeGet('colors.black.300')};
  }
`;

const LEVEL_TAG_STYLE = { PASS: 'success', HIGH: 'error', MEDIUM: 'warning', LOW: 'info' };
const LEVEL_ORDER = ['HIGH', 'MEDIUM', 'LOW', 'PASS'];
const Scope = {
  USER: 'USER',
  COLLECTIVE: 'COLLECTIVE',
  PAYEE: 'PAYEE',
  PAYOUT_METHOD: 'PAYOUT_METHOD',
};

export const expenseRequiresSecurityConfirmation = expense =>
  expense?.securityChecks?.filter(check => check.level === 'HIGH').length > 0;

const SecurityCheck = check => {
  const [isExpanded, setExpanded] = React.useState(false);

  return (
    <SecurityCheckItem key={check.message}>
      <Flex flexDirection="column" alignItems="start">
        <Box>
          <StyledTag
            type={LEVEL_TAG_STYLE[check.level]}
            fontWeight="700"
            fontSize="12px"
            lineHeight="16px"
            p="2px 6px"
            mb={2}
          >
            {upperCase(check.scope)}
          </StyledTag>
        </Box>
        <P fontWeight="500" fontSize="14px" lineHeight="20px">
          {check.message}
        </P>

        {isExpanded && (
          <P mt={2} fontWeight="500" fontSize="12px" lineHeight="20px">
            {check.details}
          </P>
        )}
      </Flex>
      {check.details && (
        <Flex alignItems="center">
          <StyledLink
            fontWeight="500"
            fontSize="13px"
            lineHeight="16px"
            ml={2}
            color="blue.500"
            onClick={() => setExpanded(!isExpanded)}
            minWidth="max-content"
          >
            {isExpanded ? (
              <FormattedMessage defaultMessage="Hide Details" />
            ) : (
              <FormattedMessage defaultMessage="Show Details" />
            )}
            {isExpanded ? <ChevronUp size="1em" /> : <ChevronDown size="1em" />}
          </StyledLink>
        </Flex>
      )}
    </SecurityCheckItem>
  );
};

const I18nScopes = defineMessages({
  ALL: {
    id: 'SecurityScope.All',
    defaultMessage: 'All Scopes',
  },
  [Scope.PAYEE]: {
    id: 'SecurityScope.Payee',
    defaultMessage: 'Payee',
  },
  [Scope.USER]: {
    id: 'Tags.USER',
    defaultMessage: 'User',
  },
  [Scope.COLLECTIVE]: {
    id: 'Collective',
    defaultMessage: 'Collective',
  },
  [Scope.PAYOUT_METHOD]: {
    id: 'SecurityScope.PayoutMethod',
    defaultMessage: 'Payout Method',
  },
});
const SecurityChecksModal = ({ expense, onClose, onConfirm, ...modalProps }) => {
  const intl = useIntl();
  const [scope, setScope] = React.useState();

  return (
    <StyledModal trapFocus onClose={onClose} width="680px" data-cy="security-check-modal" {...modalProps}>
      <ModalHeader onClose={onClose}>
        <Box>
          <H1 color="black.900" fontSize="20px" lineHeight="28px">
            {onConfirm ? (
              <FormattedMessage id="SecurityChecksModal.confirm.title" defaultMessage="Are you sure you want to pay?" />
            ) : (
              <FormattedMessage id="SecurityChecksModal.title" defaultMessage="Security Checks" />
            )}
          </H1>
          <P mt={2} color="black.700" fontWeight="400" fontSize="14px" lineHeight="20px">
            <FormattedMessage
              id="SecurityChecksModal.subtitle"
              defaultMessage="Multiple Security Checks have been flagged for this Expense. Please review and proceed with caution."
            />
          </P>
        </Box>
      </ModalHeader>
      <ModalBody mb={0} mt="24px">
        <StyledFilters
          p={0}
          filters={['ALL', ...uniq(expense?.securityChecks?.map(check => check.scope))]}
          getLabel={key => intl.formatMessage(I18nScopes[key])}
          onChange={filter => (filter === 'ALL' ? setScope() : setScope(filter))}
          selected={scope}
        />
        <StyledCard mt={3}>
          {expense.securityChecks
            .filter(check => (scope ? check.scope === scope : true))
            .map(check => (
              <SecurityCheck key={check.message} {...check} />
            ))}
        </StyledCard>
      </ModalBody>
      {onConfirm && (
        <ModalFooter isFullWidth>
          <Flex justifyContent="space-between">
            <StyledButton onClick={onClose}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton buttonStyle="primary" onClick={onConfirm} data-cy="pay-button">
              <FormattedMessage id="SecurityChecksModal.confirm.button" defaultMessage="Yes, Continue to Payment" />
            </StyledButton>
          </Flex>
        </ModalFooter>
      )}
    </StyledModal>
  );
};

SecurityChecksModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  expense: PropTypes.shape({
    securityChecks: PropTypes.arrayOf(
      PropTypes.shape({
        scope: PropTypes.string,
        level: PropTypes.string,
        message: PropTypes.string,
      }),
    ),
  }),
};

const Indicator = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  right: 0%;
  top: -10%;
  bottom: 90%;
  left: 70%;
  border-radius: 50%;
  color: #fff;
  padding: 9px;
  border: 1px solid #fff;
  background-color: ${themeGet('colors.red.500')};
  font-size: 10px;
  font-weight: 700;
`;

const RoundButton = styled(StyledRoundButton)`
  position: relative;
`;

const LEVEL_BUTTON_STYLE = {
  PASS: 'successSecondary',
  HIGH: 'dangerSecondary',
  MEDIUM: 'warningSecondary',
  LOW: 'secondary',
};

export const SecurityChecksButton = ({ expense, ...buttonProps }) => {
  const [hasModal, setHasModal] = React.useState(false);
  const highRiskChecks = expense?.securityChecks?.filter(check => check.level === 'HIGH').length || 0;
  const higherRisk = first(compact(LEVEL_ORDER.map(level => find(expense?.securityChecks, { level }))));
  const ShieldIcon = highRiskChecks ? ShieldAlert : ShieldCheck;

  return (
    <React.Fragment>
      <RoundButton
        {...buttonProps}
        buttonStyle={LEVEL_BUTTON_STYLE[higherRisk?.level] || 'secondary'}
        onClick={() => setHasModal(true)}
      >
        {highRiskChecks ? <Indicator>{highRiskChecks}</Indicator> : null}
        <ShieldIcon size={18} />
      </RoundButton>
      {hasModal && <SecurityChecksModal expense={expense} onClose={() => setHasModal(false)} />}
    </React.Fragment>
  );
};

SecurityChecksButton.propTypes = {
  ...SecurityChecksModal.propTypes,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
};

export default SecurityChecksModal;
