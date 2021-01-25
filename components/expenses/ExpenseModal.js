import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { useIntl } from 'react-intl';

import { formatErrorMessage } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import Modal, { ModalBody, ModalFooter } from '../StyledModal';

import { expensePageExpenseFieldsFragment } from './graphql/fragments';
import ExpenseAdminActions from './ExpenseAdminActions';
import ExpenseSummary from './ExpenseSummary';
import ProcessExpenseButtons from './ProcessExpenseButtons';

const expenseModalQuery = gqlV2/* GraphQL */ `
  query ExpenseModal($legacyExpenseId: Int!) {
    expense(expense: { legacyId: $legacyExpenseId }) {
      ...ExpensePageExpenseFields
    }
  }
  ${expensePageExpenseFieldsFragment}
`;

const ExpenseModal = ({ expense, onDelete, onProcess, onClose, show }) => {
  const intl = useIntl();
  const [error, setError] = React.useState(null);
  const { data, loading } = useQuery(expenseModalQuery, {
    variables: { legacyExpenseId: expense.legacyId },
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
  });

  return (
    <Modal
      onClose={onClose}
      show={show}
      width="728px"
      maxWidth="100%"
      position="relative"
      padding={0}
      overflowY="hidden"
    >
      <ModalBody maxHeight="calc(80vh - 80px)" overflowY="auto" mb={80} p={20}>
        <ExpenseSummary
          isLoading={loading || !data}
          expense={!loading ? data?.expense : null}
          host={!loading ? data?.expense?.account?.host : null}
          collective={!loading ? data?.expense?.account : null}
          onDelete={onDelete}
          onClose={onClose}
          borderless
        />
      </ModalBody>
      <ModalFooter
        position="absolute"
        width="100%"
        left={0}
        bottom={0}
        background="white"
        dividerMargin="0"
        minHeight={80}
      >
        {error && (
          <Box p={2}>
            <MessageBox flex="1 0 100%" type="error" withIcon>
              {formatErrorMessage(intl, error)}
            </MessageBox>
          </Box>
        )}
        {data?.expense && (
          <Flex p={3} justifyContent="space-between" alignItems="flex-end">
            <Box display={['none', 'flex']}>
              <ExpenseAdminActions
                collective={data.expense.account}
                expense={data.expense}
                permissions={pick(data.expense.permissions, ['canSeeInvoiceInfo', 'canDelete'])}
                buttonProps={{ size: 32, m: 1 }}
                linkAction="link"
                onDelete={() => {
                  onClose();
                  if (onDelete) {
                    onDelete(expense);
                  }
                }}
              />
            </Box>
            <Flex flex="1" justifyContent={['center', 'flex-end']} flexWrap="wrap">
              <ProcessExpenseButtons
                collective={data.expense.account}
                expense={data.expense}
                host={data.expense.account.host}
                permissions={data.expense.permissions}
                buttonProps={{ buttonSize: 'small', minWidth: 130, m: 1, py: 11 }}
                showError={false}
                onError={setError}
                onSuccess={onProcess}
              />
            </Flex>
          </Flex>
        )}
      </ModalFooter>
    </Modal>
  );
};

ExpenseModal.propTypes = {
  /** If true, a button to download invoice will be displayed when possible */
  expense: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    legacyId: PropTypes.number,
  }),
  toAccount: PropTypes.shape({
    slug: PropTypes.string,
  }),
  permissions: PropTypes.shape({
    canSeeInvoiceInfo: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  show: PropTypes.bool.isRequired,
};

export default ExpenseModal;
