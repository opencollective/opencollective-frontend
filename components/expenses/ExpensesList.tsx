import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { cx } from 'class-variance-authority';
import FlipMove from 'react-flip-move';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { ChatBubbleBottomCenterIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { DISABLE_ANIMATIONS } from '../../lib/animations';
import { i18nExpenseStatus, i18nExpenseType } from '../../lib/i18n/expense';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import ExpenseBudgetItem from '../budget/ExpenseBudgetItem';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import { P } from '../Text';

import ExpenseDrawer from './ExpenseDrawer';
import NewExpenseDrawer, { ExpenseStatus } from './NewExpenseDrawer';
import dayjs from 'dayjs';

const ExpenseContainer = styled.div`
  ${props =>
    !props.isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const FooterContainer = styled.div`
  padding: 16px 27px;
  border-top: 1px solid #e6e8eb;
`;

const FooterLabel = styled.span`
  font-size: 15px;
  margin-right: 5px;
  text-transform: uppercase;
`;

const ExpensesTotal = ({ collective, host, expenses, expenseFieldForTotalAmount }) => {
  const { total, isApproximate } = React.useMemo(() => {
    let isApproximate = false;
    let total = 0;
    for (const expense of expenses) {
      total += expense[expenseFieldForTotalAmount]?.valueInCents || expense.amount;
      if (expense[expenseFieldForTotalAmount]?.exchangeRate?.isApproximate) {
        isApproximate = true;
      }
    }

    return { total, isApproximate };
  }, [expenses]);

  return (
    <React.Fragment>
      {isApproximate && `~ `}
      <FormattedMoneyAmount amount={total} currency={collective?.currency || host?.currency} precision={2} />
    </React.Fragment>
  );
};

ExpensesTotal.propTypes = {
  collective: PropTypes.object,
  host: PropTypes.object,
  expenses: PropTypes.array,
  expenseFieldForTotalAmount: PropTypes.string,
};

const ExpensesList = ({
  collective,
  host,
  expenses,
  isLoading,
  nbPlaceholders,
  isInverted,
  suggestedTags,
  view,
  onDelete,
  onProcess,
  expenseFieldForTotalAmount,
}) => {
  const [expenseInDrawer, setExpenseInDrawer] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState(null);
  const [useNewDrawer, setUseNewDrawer] = React.useState(true);
  const intl = useIntl();

  if (!expenses?.length && !isLoading) {
    return null;
  }

  const expandExpense = expense => {
    // if the command key is held down, open the expense in a new tab
    // if (window?.event?.metaKey) {
    //   setUseNewDrawer(false);
    // } else {
    setUseNewDrawer(true);
    // }
    setExpenseInDrawer(expense);
    setSelectedId(expense.id);
  };

  return (
    <Fragment>
      <div>
        <div className="my-6 overflow-hidden ">
          <div className="">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
              <table className="w-full text-left">
                <thead className="sr-only">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      <a href="#" className="group inline-flex">
                        Collective
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Title
                        <span className="ml-1 flex-none rounded bg-gray-100 text-gray-900 group-hover:bg-gray-200">
                          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Submitter
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            className="invisible ml-1 h-5 w-5 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Submitted at
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            className="invisible ml-1 h-5 w-5 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Comments
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            className="invisible ml-1 h-5 w-5 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Attachments
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            className="invisible ml-1 h-5 w-5 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Amount
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            className="invisible ml-1 h-5 w-5 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="px-1 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <a href="#" className="group inline-flex">
                        Status
                        <span className="invisible ml-1 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            className="invisible ml-1 h-5 w-5 flex-none rounded text-gray-400 group-hover:visible group-focus:visible"
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-0">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="relative border-t border-gray-100">
                  {expenses?.map(expense => {
                    const isMultiCurrency =
                      expense?.amountInAccountCurrency &&
                      expense.amountInAccountCurrency?.currency !== expense.currency;

                    return (
                      <tr
                        key={expense.id}
                        className={cx([
                          'cursor-pointer border-b border-gray-100 hover:bg-gray-50',
                          selectedId === expense.id && 'bg-gray-50',
                        ])}
                        onClick={() => expandExpense(expense)}
                      >
                        <td className="truncate py-5 pl-4 pr-1">
                          <div className="text-sm leading-6 text-gray-900">
                            <span className="flex items-center">
                              <img
                                className="h-6 w-6 rounded-md object-cover shadow-sm"
                                src={expense.account.imageUrl}
                                alt="Manyverse logo"
                              />
                              {/* <span>{expense.account.name}</span> */}
                            </span>
                          </div>
                        </td>
                        <td className="truncate px-1 py-5">
                          <div className="text-sm font-medium leading-6 text-gray-900">
                            {expense.description} <span className="text-gray-400">#{expense.legacyId}</span>
                            {/* <span className="text-gray-400">#{expense.legacyId}</span> */}
                          </div>
                          {/* <div className="mt-1 text-xs leading-5 text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <img
                                className="h-4 w-4 rounded object-cover shadow-sm"
                                src={expense.account.imageUrl}
                                alt="Manyverse logo"
                              />
                              <span className="text-gray-900">{expense.account.name}</span>
                              <span className="text-sm text-gray-200">/</span>
                              <span>{i18nExpenseType(intl, expense.type, expense.legacyId)}</span>
                            </span>
                          </div> */}
                        </td>

                        <td className="truncate px-4 py-5">
                          <div className="text-sm leading-5 text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <img
                                src={expense.createdByAccount.imageUrl}
                                className="h-4 w-4 rounded-full"
                                alt="avatar"
                              />
                              <span className="whitespace-nowrap text-gray-500">{expense.createdByAccount.name}</span>
                            </span>
                          </div>
                        </td>
                        <td className="truncate px-4 py-5">
                          <div className="whitespace-nowrap text-sm leading-5 text-gray-500">
                            <span>{dayjs(expense.createdAt).format('MMM D, YYYY')}</span>
                          </div>
                        </td>
                        <td className="truncate px-1 py-5 ">
                          {expense.comments.totalCount ? (
                            <div className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-gray-500">
                              <ChatBubbleBottomCenterIcon className="h-4 w-4 flex-shrink-0 " />
                              <span className="leading-5">{expense.comments.totalCount}</span>
                            </div>
                          ) : null}
                        </td>

                        <td className="truncate px-1 py-5 ">
                          {expense.attachedFiles?.length ? (
                            <div className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-gray-500">
                              <PaperClipIcon className="h-4 w-4 flex-shrink-0 " />
                              <span className="leading-5">{expense.attachedFiles.length}</span>
                            </div>
                          ) : null}
                        </td>

                        <td className="truncate py-5 pr-6 text-right">
                          <div className="flex flex-auto flex-col justify-end">
                            <div className="text-sm font-medium leading-6 text-gray-900">
                              <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} precision={2} />
                            </div>
                            {isMultiCurrency && (
                              <div className="mt-1 text-xs leading-5 text-gray-500">
                                <AmountWithExchangeRateInfo
                                  showTooltip={false}
                                  amount={expense.amountInAccountCurrency}
                                />
                              </div>
                            )}
                          </div>
                          {/* <div className="absolute bottom-0 right-0 h-px w-screen bg-gray-100" />
                          <div className="absolute bottom-0 left-0 h-px w-screen bg-gray-100" /> */}
                        </td>
                        <td className="truncate py-5 pr-6 text-right">
                          <ExpenseStatus size={'small'} status={expense.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <StyledCard>
        <NewExpenseDrawer
          open={useNewDrawer && Boolean(selectedId)}
          handleClose={() => setSelectedId(null)}
          expense={expenseInDrawer}
        />
        <ExpenseDrawer
          open={!useNewDrawer && Boolean(selectedId)}
          handleClose={() => setSelectedId(null)}
          expense={expenseInDrawer}
        />{' '}
        {isLoading ? (
          [...new Array(nbPlaceholders)].map((_, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <ExpenseContainer key={idx}>
              <ExpenseBudgetItem isLoading />
            </ExpenseContainer>
          ))
        ) : (
          <FlipMove enterAnimation="fade" leaveAnimation="fade" disableAllAnimations={DISABLE_ANIMATIONS}>
            {expenses.map(expense => {
              return (
                <ExpenseContainer key={expense.id} data-cy={`expense-${expense.status}`}>
                  <ExpenseBudgetItem
                    isInverted={isInverted}
                    expense={expense}
                    host={host}
                    showProcessActions
                    view={view}
                    onDelete={onDelete}
                    onProcess={onProcess}
                    suggestedTags={suggestedTags}
                    selected={selectedId === expense.id}
                    expandExpense={() => expandExpense(expense)}
                  />
                </ExpenseContainer>
              );
            })}
          </FlipMove>
        )}
        {!isLoading && (
          <FooterContainer>
            <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
              <Flex
                my={2}
                mr={[3, 0]}
                minWidth={100}
                justifyContent="flex-end"
                data-cy="transaction-amount"
                flexDirection="column"
              >
                <Box alignSelf="flex-end">
                  <FooterLabel color="black.500">
                    <FormattedMessage id="expense.page.total" defaultMessage="Page Total" />:
                  </FooterLabel>
                  <FooterLabel color="black.500">
                    <ExpensesTotal
                      expenses={expenses}
                      collective={collective}
                      host={host}
                      expenseFieldForTotalAmount={expenseFieldForTotalAmount}
                    />
                  </FooterLabel>
                </Box>
                <P fontSize="12px" color="black.600">
                  <FormattedMessage id="expense.page.description" defaultMessage="Payment processor fees may apply." />
                </P>
              </Flex>
            </Flex>
          </FooterContainer>
        )}
      </StyledCard>
    </Fragment>
  );
};

const condensedCardExpense = (expense, expandExpense, selectedId, intl) => {
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency?.currency !== expense.currency;

  return (
    <tr
      key={expense.id}
      className={cx([
        'cursor-pointer border-b border-gray-100 hover:bg-gray-50',
        selectedId === expense.id && 'bg-gray-50',
      ])}
      onClick={() => expandExpense(expense)}
    >
      {/* <td className="px-4 py-5">
      <div className="text-sm leading-6 text-gray-900">
        <span className="flex items-center gap-2">
          <img
            className="h-8 w-8 rounded-md object-cover shadow"
            src={expense.account.imageUrl}
            alt="Manyverse logo"
          />
          <span>{expense.account.name}</span>
        </span>
      </div>
    </td> */}
      <td className="px-4 py-5">
        <div className="text-sm font-medium leading-6 text-gray-900">
          {expense.description}
          {/* <span className="text-gray-400">#{expense.legacyId}</span> */}
        </div>
        <div className="mt-1 text-xs leading-5 text-gray-500">
          <span className="flex items-center gap-1.5">
            <img
              className="h-4 w-4 rounded object-cover shadow-sm"
              src={expense.account.imageUrl}
              alt="Manyverse logo"
            />
            <span className="text-gray-900">{expense.account.name}</span>
            <span className="text-sm text-gray-200">/</span>
            <span>{i18nExpenseType(intl, expense.type, expense.legacyId)}</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-5">
        <div className="text-xs leading-5 text-gray-500">
          <span className="flex items-center gap-1.5">
            <img src={expense.createdByAccount.imageUrl} className="h-4 w-4 rounded-full" alt="avatar" />
            <span className="text-gray-900">{expense.createdByAccount.name}</span>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 flex-none fill-gray-300">
              <circle cx="1" cy="1" r="1" />
            </svg>
            <span>{dayjs(expense.createdAt).format('MMM D, YYYY')}</span>
          </span>
        </div>
      </td>
      <td className="py-5 text-right">
        {/* <div className="flex justify-end">
      <a
        href={expense.href}
        className="text-sm font-medium leading-6 text-indigo-600 hover:text-indigo-500"
      >
        View<span className="hidden sm:inline"> expense</span>
        <span className="sr-only">
          , invoice #{expense.invoiceNumber}, {expense.client}
        </span>
      </a>
    </div>
    <div className="mt-1 text-xs leading-5 text-gray-500">
      Invoice <span className="text-gray-900">#{expense.invoiceNumber}</span>
    </div> */}
      </td>
      <td className="relative py-5 pr-6 text-right">
        <div className="flex flex-auto flex-col justify-end">
          <div className="text-sm font-medium leading-6 text-gray-900">
            <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} precision={2} />
          </div>
          {isMultiCurrency && (
            <div className="mt-1 text-xs leading-5 text-gray-500">
              <AmountWithExchangeRateInfo showTooltip={false} amount={expense.amountInAccountCurrency} />
            </div>
          )}
        </div>
        {/* <div className="absolute bottom-0 right-0 h-px w-screen bg-gray-100" />
      <div className="absolute bottom-0 left-0 h-px w-screen bg-gray-100" /> */}
      </td>
      <td className="relative py-5 pr-6 text-right">
        <ExpenseStatus size={'small'} status={expense.status} />
      </td>
    </tr>
  );
};

ExpensesList.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  /** When `isLoading` is true, this sets the number of "loadin" items displayed */
  nbPlaceholders: PropTypes.number,
  host: PropTypes.object,
  view: PropTypes.oneOf(['public', 'admin', 'submitter']),
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  /** Defines the field in `expense` that holds the amount. Useful to display the right one based on the context for multi-currency expenses. */
  expenseFieldForTotalAmount: PropTypes.string,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
    currency: PropTypes.string,
  }),
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number.isRequired,
    }),
  ),
  totalAmount: PropTypes.number,
};

ExpensesList.defaultProps = {
  nbPlaceholders: 10,
  view: 'public',
  expenseFieldForTotalAmount: 'amountInAccountCurrency',
};

export default ExpensesList;
