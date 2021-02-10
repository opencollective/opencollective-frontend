import React from 'react';
import PropTypes from 'prop-types';
import { Maximize2 as MaximizeIcon } from '@styled-icons/feather/Maximize2';
import { includes, size } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';

import AutosizeText from '../AutosizeText';
import Avatar from '../Avatar';
import Container from '../Container';
import ExpenseFilesPreviewModal from '../expenses/ExpenseFilesPreviewModal';
import ExpenseModal from '../expenses/ExpenseModal';
import ExpenseStatusTag from '../expenses/ExpenseStatusTag';
import ExpenseTags from '../expenses/ExpenseTags';
import ExpenseTypeTag from '../expenses/ExpenseTypeTag';
import PayoutMethodTypeWithIcon from '../expenses/PayoutMethodTypeWithIcon';
import ProcessExpenseButtons, { DEFAULT_PROCESS_EXPENSE_BTN_PROPS } from '../expenses/ProcessExpenseButtons';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import LinkExpense from '../LinkExpense';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import { H3, P, Span } from '../Text';
import TransactionSign from '../TransactionSign';

const DetailColumnHeader = styled.div`
  font-style: normal;
  font-weight: bold;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #c4c7cc;
  margin-bottom: 2px;
`;

const ButtonsContainer = styled.div.attrs({ 'data-cy': 'expense-actions' })`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  transition: opacity 0.05s;
  justify-content: flex-end;

  @media (max-width: 40em) {
    justify-content: center;
  }

  & > *:last-child {
    margin-right: 0;
  }
`;

const ExpenseContainer = styled.div`
  padding: 16px 27px;

  @media (hover: hover) {
    &:not(:hover):not(:focus-within) ${ButtonsContainer} {
      opacity: 0.24;
    }
  }
`;

const getNbAttachedFiles = expense => {
  if (!expense) {
    return 0;
  } else if (expense.type === expenseTypes.INVOICE) {
    return 1 + size(expense.attachedFiles);
  } else {
    return size(expense.attachedFiles) + size(expense.items.filter(({ url }) => Boolean(url)));
  }
};

/**
 * A link that either link to the page or opens the modal
 */
const ExpenseTitleLink = ({ expense, collective, usePreviewModal, onDelete, onProcess, children }) => {
  const [showModal, setShowModal] = React.useState(false);
  const account = expense.account || collective;

  if (!usePreviewModal) {
    return (
      <LinkExpense collective={account} expense={expense} data-cy="expense-link">
        {children}
      </LinkExpense>
    );
  } else {
    return (
      <React.Fragment>
        {showModal && (
          <ExpenseModal
            collective={account}
            expense={expense}
            show={showModal}
            onClose={() => setShowModal(false)}
            permissions={expense.permissions}
            onDelete={onDelete}
            onProcess={onProcess}
          />
        )}
        <Container cursor="pointer" onClick={() => setShowModal(true)}>
          {children}
        </Container>
      </React.Fragment>
    );
  }
};

const ExpenseBudgetItem = ({
  isLoading,
  host,
  isInverted,
  showAmountSign,
  collective,
  expense,
  showProcessActions,
  usePreviewModal,
  view,
  onDelete,
  onProcess,
}) => {
  const [hasFilesPreview, showFilesPreview] = React.useState(false);
  const featuredProfile = isInverted ? collective : expense?.payee;
  const isAdminView = view === 'admin';
  const nbAttachedFiles = !isAdminView ? 0 : getNbAttachedFiles(expense);

  return (
    <ExpenseContainer data-cy={`expense-container-${expense?.legacyId}`}>
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Flex flex="1" minWidth="max(50%, 200px)" maxWidth={[null, '70%']} mr="24px">
          <Box mr={3}>
            {isLoading ? (
              <LoadingPlaceholder width={40} height={40} />
            ) : (
              <LinkCollective collective={featuredProfile}>
                <Avatar collective={featuredProfile} radius={40} />
              </LinkCollective>
            )}
          </Box>
          {isLoading ? (
            <LoadingPlaceholder height={60} />
          ) : (
            <Box>
              <ExpenseTitleLink
                collective={expense.account || collective}
                expense={expense}
                usePreviewModal={usePreviewModal}
                onDelete={onDelete}
                onProcess={onProcess}
              >
                <AutosizeText
                  value={expense.description}
                  maxLength={255}
                  minFontSizeInPx={12}
                  maxFontSizeInPx={14}
                  lengthThreshold={72}
                >
                  {({ value, fontSize }) => (
                    <H3
                      fontWeight="500"
                      lineHeight="1.5em"
                      textDecoration="none"
                      color="black.900"
                      fontSize={`${fontSize}px`}
                      data-cy="expense-title"
                    >
                      {value}
                    </H3>
                  )}
                </AutosizeText>
              </ExpenseTitleLink>
              <P mt="5px" fontSize="12px" color="black.700">
                {isAdminView ? (
                  <LinkCollective collective={collective} />
                ) : (
                  <FormattedMessage
                    id="CreatedBy"
                    defaultMessage="by {name}"
                    values={{ name: <LinkCollective collective={expense.createdByAccount} /> }}
                  />
                )}
                {' • '}
                <FormattedDate value={expense.createdAt} />
                {isAdminView && (
                  <React.Fragment>
                    {' • '}
                    <FormattedMessage
                      id="BalanceAmount"
                      defaultMessage="Balance {balance}"
                      values={{
                        balance: (
                          <FormattedMoneyAmount
                            amount={collective.stats?.balance?.valueInCents}
                            currency={collective.currency}
                            amountStyles={{ color: 'black.700' }}
                          />
                        ),
                      }}
                    />
                  </React.Fragment>
                )}
              </P>
            </Box>
          )}
        </Flex>
        <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
          <Flex my={2} mr={[3, 0]} minWidth={100} justifyContent="flex-end" data-cy="transaction-amount">
            {isLoading ? (
              <LoadingPlaceholder height={19} width={120} />
            ) : (
              <React.Fragment>
                {showAmountSign && <TransactionSign isCredit={isInverted} />}
                <Span color="black.700" fontSize="16px">
                  <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} precision={2} />
                </Span>
              </React.Fragment>
            )}
          </Flex>
          {isLoading ? (
            <LoadingPlaceholder height={20} width={140} />
          ) : (
            <Flex>
              {isAdminView && (
                <ExpenseTypeTag type={expense.type} legacyId={expense.legacyId} mb={0} py={0} mr="2px" fontSize="9px" />
              )}
              <ExpenseStatusTag
                status={expense.status}
                fontSize="9px"
                lineHeight="14px"
                p="3px 8px"
                showTaxFormTag={includes(expense.requiredLegalDocuments, 'US_TAX_FORM')}
                showTaxFormMsg={expense.payee.isAdmin}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center" mt={2}>
        <Box mt={2}>
          {isAdminView ? (
            <Flex>
              <Box mr={[3, 4]}>
                <DetailColumnHeader>
                  <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
                </DetailColumnHeader>
                <Box mt="6px">
                  <PayoutMethodTypeWithIcon
                    isLoading={isLoading}
                    type={expense?.payoutMethod?.type}
                    iconSize="10px"
                    fontSize="11px"
                    fontWeight="normal"
                    color="black.700"
                  />
                </Box>
              </Box>
              {nbAttachedFiles > 0 && (
                <Box mr={[3, 4]}>
                  <DetailColumnHeader>
                    <FormattedMessage id="Expense.Attachments" defaultMessage="Attachments" />
                  </DetailColumnHeader>
                  {isLoading ? (
                    <LoadingPlaceholder height={15} width={90} />
                  ) : (
                    <StyledButton
                      color="black.700"
                      fontSize="11px"
                      cursor="pointer"
                      buttonSize="tiny"
                      onClick={() => showFilesPreview(true)}
                      px={2}
                      ml={-2}
                      isBorderless
                    >
                      <MaximizeIcon size={10} />
                      &nbsp;&nbsp;
                      <FormattedMessage
                        id="ExepenseAttachments.count"
                        defaultMessage="{count, plural, one {# attachment} other {# attachments}}"
                        values={{ count: nbAttachedFiles }}
                      />
                    </StyledButton>
                  )}
                </Box>
              )}
            </Flex>
          ) : (
            <ExpenseTags expense={expense} />
          )}
        </Box>
        {showProcessActions && expense?.permissions && (
          <ButtonsContainer>
            <ProcessExpenseButtons
              host={host}
              collective={expense.account || collective}
              expense={expense}
              permissions={expense.permissions}
              buttonProps={{ ...DEFAULT_PROCESS_EXPENSE_BTN_PROPS, mx: 1, py: 2 }}
              onSuccess={onProcess}
            />
          </ButtonsContainer>
        )}
      </Flex>
      {hasFilesPreview && (
        <ExpenseFilesPreviewModal
          show
          collective={collective}
          expense={expense}
          onClose={() => showFilesPreview(false)}
        />
      )}
    </ExpenseContainer>
  );
};

ExpenseBudgetItem.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  usePreviewModal: PropTypes.bool,
  showAmountSign: PropTypes.bool,
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  showProcessActions: PropTypes.bool,
  view: PropTypes.oneOf(['public', 'admin']),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    stats: PropTypes.shape({
      balance: PropTypes.shape({
        valueInCents: PropTypes.number,
      }),
    }),
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  host: PropTypes.object,
  expense: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    legacyId: PropTypes.number,
    type: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    permissions: PropTypes.object,
    items: PropTypes.arrayOf(PropTypes.object),
    requiredLegalDocuments: PropTypes.arrayOf(PropTypes.string),
    attachedFiles: PropTypes.arrayOf(PropTypes.object),
    payee: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      imageUrl: PropTypes.string.isRequired,
      isAdmin: PropTypes.bool,
    }),
    payoutMethod: PropTypes.shape({
      type: PropTypes.string,
    }),
    createdByAccount: PropTypes.shape({
      type: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    /** If available, this `account` will be used to link expense in place of the `collective` */
    account: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }),
};

ExpenseBudgetItem.defaultProps = {
  view: 'public',
};

export default ExpenseBudgetItem;
