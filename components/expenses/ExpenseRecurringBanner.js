import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { getDateFromValue, toIsoDateStr } from '../../lib/date-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { RecurringExpenseIntervals, RecurringIntervalOptions } from '../../lib/i18n/expense';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const recurringExpensePropType = PropTypes.shape({
  id: PropTypes.string,
  interval: PropTypes.string,
  endsAt: PropTypes.string,
}).isRequired;

const deleteExpenseMutation = gql`
  mutation DeleteExpense($expense: ExpenseReferenceInput!) {
    deleteExpense(expense: $expense) {
      id
    }
  }
`;

const ExpenseRecurringEditModal = ({ onClose, expense }) => {
  const { recurringExpense } = expense;
  const [deleteExpense, { loading }] = useMutation(deleteExpenseMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  const intl = useIntl();
  const router = useRouter();

  const handleDeletion = async () => {
    try {
      await deleteExpense({ variables: { expense: pick(expense, ['id']) } });
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Expense deleted', id: 'KYXMJ6' }),
      });
      router.push(getCollectivePageRoute(expense.account));
      onClose();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <StyledModal role="alertdialog" width="432px" onClose={onClose} padding="auto" px={4} py="20px" trapFocus>
      <ModalHeader onClose={onClose}>Recurring Expense Setting</ModalHeader>
      <ModalBody pt={2}>
        <Flex flexDirection={'column'}>
          <P color="black.700" fontWeight="400" fontSize="14px" lineHeight="20px" mt={0} mb={2}>
            <FormattedMessage
              id="Expense.Recurring.Edit.Description"
              defaultMessage="Once the frequency and end date are set, you can't edit them. You can always cancel the recurring expense and submit a new one."
            />
          </P>
          <Box>
            <P color="black.700" fontWeight="600" fontSize="13px" lineHeight="16px" mt={2} mb={1}>
              <FormattedMessage id="Frequency" defaultMessage="Frequency" />
            </P>
            <StyledSelect
              inputId="recurring-frequency"
              menuPlacement="auto"
              isSearchable={false}
              value={RecurringIntervalOptions.find(option => option.value === recurringExpense.interval)}
              options={RecurringIntervalOptions}
              disabled
            />
          </Box>
          <Box>
            <P color="black.700" fontWeight="600" fontSize="13px" lineHeight="16px" mt={2} mb={1}>
              <FormattedMessage id="EndDate" defaultMessage="End Date" />
            </P>
            <StyledInput
              type="date"
              inputId="recurring-end-date"
              menuPlacement="auto"
              isSearchable={false}
              height="38px"
              width="100%"
              value={recurringExpense.endsAt && toIsoDateStr(getDateFromValue(recurringExpense.endsAt))}
              disabled
            />
          </Box>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Container display="flex" justifyContent={['center']} flexWrap="Wrap">
          <StyledButton
            mx={20}
            my={1}
            autoFocus
            minWidth={140}
            buttonStyle="dangerSecondary"
            buttonSize="small"
            onClick={handleDeletion}
            disabled={loading}
          >
            <FormattedMessage id="Expense.Recurring.Edit.Cancel" defaultMessage="Cancel Recurring Expense" />
          </StyledButton>
        </Container>
      </ModalFooter>
    </StyledModal>
  );
};

ExpenseRecurringEditModal.propTypes = {
  expense: PropTypes.shape({
    id: PropTypes.string,
    account: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    recurringExpense: recurringExpensePropType,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

const ExpenseRecurringBanner = ({ expense }) => {
  const { recurringExpense } = expense;
  const [isEditModalOpen, setEditModal] = React.useState(false);

  return (
    <React.Fragment>
      <MessageBox mt={4} type="warning">
        <P color="black.800" fontWeight="700" fontSize="13px" lineHeight="20px">
          <FormattedMessage id="Expense.Recurring.EditWarning.Title" defaultMessage="This is a recurring expense." />
        </P>
        <P color="black.800" fontWeight="400" fontSize="13px" lineHeight="20px" mt={1}>
          <FormattedMessage
            id="Expense.Recurring.EditWarning.Description"
            defaultMessage="Any changes you make to this expense will apply to future recurrences."
          />
        </P>
        <P color="black.800" fontWeight="400" fontSize="12px" lineHeight="18px" mt={1}>
          ({RecurringExpenseIntervals[recurringExpense.interval]}
          {recurringExpense.endsAt && (
            <React.Fragment>
              ,&nbsp;
              <FormattedMessage
                id="Expense.Recurring.EditWarning.Ends"
                defaultMessage="ends {endsAt, date, medium}"
                values={{ endsAt: getDateFromValue(recurringExpense.endsAt) }}
              />
            </React.Fragment>
          )}
          ) &nbsp;
          <StyledLink color="black.800" onClick={() => setEditModal(true)}>
            <FormattedMessage id="Expense.Recurring.Edit" defaultMessage="Edit details" />
          </StyledLink>
        </P>
      </MessageBox>
      {isEditModalOpen && <ExpenseRecurringEditModal onClose={() => setEditModal(false)} expense={expense} />}
    </React.Fragment>
  );
};

ExpenseRecurringBanner.propTypes = {
  expense: PropTypes.shape({
    id: PropTypes.string,
    account: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    recurringExpense: recurringExpensePropType,
  }).isRequired,
};

export default ExpenseRecurringBanner;
