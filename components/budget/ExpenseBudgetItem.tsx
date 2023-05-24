import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from '@styled-icons/feather/AlertTriangle';
import { Maximize2 as MaximizeIcon } from '@styled-icons/feather/Maximize2';
import { get, includes, size } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { space } from 'styled-system';

import expenseStatus from '../../lib/constants/expense-status';
import expenseTypes from '../../lib/constants/expenseTypes';
import { Amount, Expense, ExpenseStatus, Host } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { AmountPropTypeShape } from '../../lib/prop-types';
import { toPx } from '../../lib/theme/helpers';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import AutosizeText from '../AutosizeText';
import { AvatarWithLink } from '../AvatarWithLink';
import Container from '../Container';
import DateTime from '../DateTime';
import AdminExpenseStatusTag from '../expenses/AdminExpenseStatusTag';
import ExpenseFilesPreviewModal from '../expenses/ExpenseFilesPreviewModal';
import ExpenseStatusTag from '../expenses/ExpenseStatusTag';
import ExpenseTypeTag from '../expenses/ExpenseTypeTag';
import PayoutMethodTypeWithIcon from '../expenses/PayoutMethodTypeWithIcon';
import ProcessExpenseButtons, {
  DEFAULT_PROCESS_EXPENSE_BTN_PROPS,
  hasProcessButtons,
} from '../expenses/ProcessExpenseButtons';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import CommentIcon from '../icons/CommentIcon';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
import Tags from '../Tags';
import { H3, P, Span } from '../Text';
import TransactionSign from '../TransactionSign';

const DetailColumnHeader = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #4d4f51;
  margin-bottom: 2px;
`;

const ButtonsContainer = styled.div.attrs({ 'data-cy': 'expense-actions' })`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  grid-gap: 8px;
  transition: opacity 0.05s;
  justify-content: flex-end;

  @media (max-width: 40em) {
    justify-content: center;
  }

  & > *:last-child {
    margin-right: 0;
  }
`;

type ExpenseContainerProps = { useDrawer?: boolean; selected?: boolean };
const ExpenseContainer = styled.div`
  outline: none;
  display: block;
  width: 100%;
  border: 0;
  background: white;
  ${space}

  transition: background 0.1s;

  ${(props: ExpenseContainerProps) =>
    props.useDrawer &&
    css<ExpenseContainerProps>`
      ${props => props.selected && `background: #f8fafc;`}
    `}

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
    return size(expense.attachedFiles);
  } else {
    return size(expense.attachedFiles) + size(expense.items.filter(({ url }) => Boolean(url)));
  }
};

const ExpenseBudgetItem = ({
  isLoading,
  host,
  isInverted,
  showAmountSign,
  expense,
  showProcessActions,
  view,
  suggestedTags,
  onProcess,
  selected,
  expandExpense,
}: ExpenseBudgetItemProps) => {
  const [hasFilesPreview, showFilesPreview] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();
  const useDrawer = LoggedInUser?.hasEarlyAccess('expense-drawer');

  const featuredProfile = isInverted ? expense?.account : expense?.payee;
  const isAdminView = view === 'admin';
  const isSubmitterView = view === 'submitter';
  const isCharge = expense?.type === expenseTypes.CHARGE;
  const pendingReceipt = isCharge && expense?.items?.every(i => i.url === null);
  const nbAttachedFiles = !isAdminView ? 0 : getNbAttachedFiles(expense);
  const isExpensePaidOrRejected = [ExpenseStatus.REJECTED, ExpenseStatus.PAID].includes(expense?.status);
  const shouldDisplayStatusTagActions =
    (isExpensePaidOrRejected || expense?.status === expenseStatus.APPROVED) &&
    (hasProcessButtons(expense.permissions) || expense.permissions.canMarkAsIncomplete);
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency?.currency !== expense.currency;

  const isLoggedInUserExpenseHostAdmin = LoggedInUser?.isAdminOfCollective(host);
  const isLoggedInUserExpenseAdmin = LoggedInUser?.isAdminOfCollective(expense?.account);
  const isViewingExpenseInHostContext = isLoggedInUserExpenseHostAdmin && !isLoggedInUserExpenseAdmin;

  return (
    <ExpenseContainer
      px={[3, '24px']}
      py={3}
      data-cy={`expense-container-${expense?.legacyId}`}
      selected={selected}
      useDrawer={useDrawer}
    >
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Flex flex="1" minWidth="max(50%, 200px)" maxWidth={[null, '70%']} mr="24px">
          <Box mr={3}>
            {isLoading ? (
              <LoadingPlaceholder width={40} height={40} />
            ) : (
              <AvatarWithLink
                size={40}
                account={featuredProfile}
                secondaryAccount={featuredProfile.id === expense.createdByAccount.id ? null : expense.createdByAccount}
              />
            )}
          </Box>
          {isLoading ? (
            <LoadingPlaceholder height={60} />
          ) : (
            <Box>
              <StyledTooltip
                content={
                  useDrawer ? (
                    <FormattedMessage id="Expense.SeeDetails" defaultMessage="See expense details" />
                  ) : (
                    <FormattedMessage id="Expense.GoToPage" defaultMessage="Go to expense page" />
                  )
                }
                delayHide={0}
              >
                <StyledLink
                  underlineOnHover
                  {...(useDrawer
                    ? {
                        as: Link,
                        href: `${getCollectivePageRoute(expense.account)}/expenses/${expense.legacyId}`,
                        onClick: expandExpense,
                      }
                    : {
                        as: Link,
                        href: `${getCollectivePageRoute(expense.account)}/expenses/${expense.legacyId}`,
                      })}
                >
                  <AutosizeText
                    value={expense.description}
                    maxLength={255}
                    minFontSizeInPx={12}
                    maxFontSizeInPx={16}
                    lengthThreshold={72}
                    mobileRatio={0.875}
                    valueFormatter={toPx}
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
                </StyledLink>
              </StyledTooltip>

              <P mt="5px" fontSize="12px" color="black.700">
                {isAdminView ? (
                  <LinkCollective collective={expense.account} />
                ) : (
                  <FormattedMessage
                    defaultMessage="from {payee} to {account}"
                    values={{
                      payee: <LinkCollective collective={expense.payee} />,
                      account: <LinkCollective collective={expense.account} />,
                    }}
                  />
                )}
                {isAdminView && Boolean(expense?.comments?.totalCount) && (
                  <React.Fragment>
                    {' • '}
                    {expense?.comments.totalCount}
                    &nbsp;
                    <CommentIcon size={14} color="#4D4F51" />
                  </React.Fragment>
                )}
              </P>
              <P mt="5px" fontSize="12px" color="black.700">
                <FormattedMessage
                  defaultMessage="On {shortDate}"
                  values={{
                    shortDate: <DateTime value={expense.createdAt} dateStyle={undefined} timeStyle={undefined} />,
                  }}
                />
              </P>
            </Box>
          )}
        </Flex>
        <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
          <Flex
            my={2}
            mr={[3, 0]}
            flexDirection="column"
            minWidth={100}
            alignItems="flex-end"
            data-cy="transaction-amount"
          >
            {isLoading ? (
              <LoadingPlaceholder height={19} width={120} />
            ) : (
              <React.Fragment>
                <div>
                  {showAmountSign && <TransactionSign isCredit={isInverted} />}
                  <Span color="black.700" fontSize="16px">
                    <FormattedMoneyAmount amount={expense.amount} currency={expense.currency} precision={2} />
                  </Span>
                </div>
                {isMultiCurrency && (
                  <Container color="black.600" fontSize="13px" my={1}>
                    <AmountWithExchangeRateInfo amount={expense.amountInAccountCurrency as any} />
                  </Container>
                )}
              </React.Fragment>
            )}
          </Flex>
          {isAdminView && (
            <Box color="black.700" fontSize="12px" mb={2}>
              <FormattedMessage
                id="CollectiveBalanceAmount"
                defaultMessage="Collective Balance <strong>{balance}</strong>"
                values={{
                  strong: I18nBold,
                  balance: (
                    <FormattedMoneyAmount
                      amount={get(
                        expense.account,
                        'stats.balanceWithBlockedFunds.valueInCents',
                        get(expense.account, 'stats.balanceWithBlockedFunds', 0) as number,
                      )}
                      currency={expense.account.currency}
                      amountStyles={{ color: 'black.700' }}
                    />
                  ),
                }}
              />
            </Box>
          )}
          {isLoading ? (
            <LoadingPlaceholder height={20} width={140} />
          ) : (
            <Flex>
              {(isAdminView || isSubmitterView) && pendingReceipt && (
                <Box mr="1px">
                  <StyledTooltip
                    content={
                      <FormattedMessage id="Expense.MissingReceipt" defaultMessage="Expense is missing its Receipt" />
                    }
                  >
                    <AlertTriangle size={18} />
                  </StyledTooltip>
                </Box>
              )}
              {(isAdminView || isSubmitterView) && (
                <ExpenseTypeTag type={expense.type} legacyId={expense.legacyId} mb={0} py={0} mr="2px" fontSize="9px" />
              )}
              {shouldDisplayStatusTagActions ? (
                <AdminExpenseStatusTag host={host} collective={expense.account} expense={expense} p="3px 8px" />
              ) : (
                <ExpenseStatusTag
                  status={expense.status}
                  fontSize="12px"
                  fontWeight="bold"
                  letterSpacing="0.06em"
                  lineHeight="16px"
                  p="3px 8px"
                  showTaxFormTag={includes(expense.requiredLegalDocuments, 'US_TAX_FORM')}
                  showTaxFormMsg={expense.payee.isAdmin}
                />
              )}
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center" mt={2}>
        <Box mt={2}>
          {isAdminView || isSubmitterView ? (
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
            <Tags
              expense={expense}
              canEdit={get(expense, 'permissions.canEditTags', false)}
              suggestedTags={suggestedTags}
            />
          )}
        </Box>
        {showProcessActions && expense?.permissions && !isExpensePaidOrRejected && (
          <ButtonsContainer>
            <ProcessExpenseButtons
              host={host}
              isViewingExpenseInHostContext={isViewingExpenseInHostContext}
              collective={expense.account}
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
          collective={expense.account}
          expense={expense}
          onClose={() => showFilesPreview(false)}
        />
      )}
    </ExpenseContainer>
  );
};

type ExpenseBudgetItemProps = {
  isLoading?: boolean;
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted?: boolean;
  showAmountSign?: boolean;
  onDelete?: () => void;
  onProcess?: () => void;
  showProcessActions?: boolean;
  view?: 'public' | 'admin' | 'submitter';
  host: Host;
  suggestedTags: string[];
  expense: Expense & { amountInAccountCurrency: Amount };
  selected: boolean;
  expandExpense?: () => void;
};

ExpenseBudgetItem.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  showAmountSign: PropTypes.bool,
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  showProcessActions: PropTypes.bool,
  view: PropTypes.oneOf(['public', 'admin', 'submitter']),
  host: PropTypes.object,
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  expense: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    legacyId: PropTypes.number,
    comments: PropTypes.shape({
      totalCount: PropTypes.number,
    }),
    type: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    amount: PropTypes.number.isRequired,
    amountInAccountCurrency: AmountPropTypeShape,
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
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    /** If available, this `account` will be used to link expense in place of the `collective` */
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string,
      stats: PropTypes.shape({
        // Collective / Balance can be v1 or v2 there ...
        balanceWithBlockedFunds: PropTypes.oneOfType([
          PropTypes.number,
          PropTypes.shape({
            valueInCents: PropTypes.number,
          }),
        ]),
      }),
      parent: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
    }),
  }),
  selected: PropTypes.bool,
  expandExpense: PropTypes.func,
};

ExpenseBudgetItem.defaultProps = {
  view: 'public',
};

export default ExpenseBudgetItem;
