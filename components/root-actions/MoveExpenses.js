import React from 'react';
import { useMutation } from '@apollo/client';
import { omit } from 'lodash';
import { FormattedDate, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import ExpensesPickerAsync from '../ExpensesPickerAsync';
import { Flex } from '../Grid';
import Link from '../Link';
import LinkExpense from '../LinkExpense';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import StyledTag from '../StyledTag';
import { P, Span } from '../Text';
import { useToast } from '../ui/useToast';

const moveExpensesMutation = gql`
  mutation MoveExpenses($destinationAccount: AccountReferenceInput!, $expenses: [ExpenseReferenceInput!]!) {
    moveExpenses(destinationAccount: $destinationAccount, expenses: $expenses) {
      id
    }
  }
`;

export default function MoveExpenses() {
  const intl = useIntl();
  const { toast } = useToast();
  const [submitMoveExpenses] = useMutation(moveExpensesMutation, { context: API_V2_CONTEXT });

  const [sourceAccount, setSourceAccount] = React.useState(null);
  const [destinationAccount, setDestinationAccount] = React.useState(null);
  const [selectedExpenses, setSelectedExpenses] = React.useState([]);

  const [isConfirmationModelOpen, setIsConfirmationModelOpen] = React.useState(false);

  const allowedAccountTypes = Object.values(omit(CollectiveType, [CollectiveType.USER, CollectiveType.INDIVIDUAL]));

  const callToAction = `Move ${selectedExpenses.length} expenses`;

  const moveExpenses = React.useCallback(async () => {
    try {
      const selectedExpensesInput = selectedExpenses.map(({ value }) => ({ id: value.id }));
      const mutationVariables = {
        expenses: selectedExpensesInput,
        destinationAccount: {
          legacyId: destinationAccount.id,
        },
      };

      await submitMoveExpenses({ variables: mutationVariables });
      toast({ variant: 'success', title: 'Expenses moved successfully', message: callToAction });
      // Reset form and purge cache
      setIsConfirmationModelOpen(false);
      setSourceAccount(null);
      setDestinationAccount(null);
      setSelectedExpenses([]);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [intl, toast, selectedExpenses, destinationAccount, callToAction, submitMoveExpenses]);

  return (
    <div>
      <StyledInputField htmlFor="sourceAccount" label="Source account for the expenses" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            types={allowedAccountTypes}
            inputId={id}
            collective={sourceAccount}
            isClearable
            onChange={option => {
              setSourceAccount(option?.value || null);
            }}
          />
        )}
      </StyledInputField>

      <StyledInputField htmlFor="selectedExpenses" label="Select expenses" flex="1 1" mt={3}>
        {({ id }) => (
          <ExpensesPickerAsync
            value={selectedExpenses}
            inputId={id}
            onChange={options => setSelectedExpenses(options)}
            disabled={!sourceAccount}
            closeMenuOnSelect={false}
            account={sourceAccount}
            noCache
            isMulti
            isClearable
          />
        )}
      </StyledInputField>

      <StyledInputField htmlFor="destinationAccount" label="Account that will receive the expenses" flex="1 1" mt={3}>
        {({ id }) => (
          <CollectivePickerAsync
            types={allowedAccountTypes}
            inputId={id}
            disabled={selectedExpenses.length === 0}
            collective={destinationAccount}
            isClearable
            onChange={option => {
              setDestinationAccount(option?.value || null);
            }}
          />
        )}
      </StyledInputField>

      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="primary"
        disabled={selectedExpenses.length === 0 || !destinationAccount}
        onClick={() => setIsConfirmationModelOpen(true)}
      >
        {callToAction}
      </StyledButton>

      {isConfirmationModelOpen && (
        <ConfirmationModal
          header={callToAction}
          continueHandler={moveExpenses}
          onClose={() => setIsConfirmationModelOpen(false)}
        >
          <P>
            You&apos;re about to move {selectedExpenses.length} expenses to{' '}
            <StyledLink as={Link} href={`/${destinationAccount.slug}`} openInNewTab>
              {destinationAccount.name}
            </StyledLink>
            .
          </P>
          <Container maxHeight={300} overflowY="auto" border="1px solid lightgrey" borderRadius="8px" mt={3}>
            {selectedExpenses.map(({ value: expense }, index) => (
              <Container
                key={expense.id}
                title={expense.description}
                borderTop={!index ? undefined : '1px solid lightgrey'}
                p={2}
              >
                <LinkExpense openInNewTab collective={expense.account} expense={expense}>
                  <Flex alignItems="center">
                    <StyledTag ml={2} fontSize="11px">
                      #{expense.legacyId}
                    </StyledTag>
                    <Span fontSize="12px" ml={2}>
                      <FormattedDate value={expense.createdAt} /> - {expense.description}
                    </Span>
                  </Flex>
                </LinkExpense>
              </Container>
            ))}
          </Container>
        </ConfirmationModal>
      )}
    </div>
  );
}
