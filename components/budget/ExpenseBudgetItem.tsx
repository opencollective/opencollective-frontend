import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from '@styled-icons/feather/AlertTriangle';
import { get, includes } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { space } from 'styled-system';

import expenseStatus from '../../lib/constants/expense-status';
import expenseTypes from '../../lib/constants/expenseTypes';
import { getFilesFromExpense } from '../../lib/expenses';
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
import ExpenseStatusTag from '../expenses/ExpenseStatusTag';
import ExpenseTypeTag from '../expenses/ExpenseTypeTag';
import ProcessExpenseButtons, {
  DEFAULT_PROCESS_EXPENSE_BTN_PROPS,
  hasProcessButtons,
} from '../expenses/ProcessExpenseButtons';
import { SecurityChecksButton } from '../expenses/SecurityChecksModal';
import FilesViewerModal from '../FilesViewerModal';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex, Grid } from '../Grid';
import CommentIcon from '../icons/CommentIcon';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
import Tags from '../Tags';
import { H3, P, Span } from '../Text';
import TransactionSign from '../TransactionSign';

const ExpenseBlockGrid = styled(Grid)`
  grid-gap: 2px;
  grid-template-columns: auto max-content minmax(min-content, max-content);
  grid-template-rows: repeat(3, min-content);

  @media (max-width: 720px) {
    grid-template-columns: 1fr min-content;
    grid-template-rows: repeat(4, min-content);
  }
`;

const SummaryGridItem = styled.div`
  display: flex;
  grid-row-start: 1;
  grid-column-start: 1;

  @media (max-width: 720px) {
    grid-row-end: span 1;
  }
`;

const DetailsGridItem = styled.div`
  grid-column-start: 2;
  grid-column-end: span 2;
  grid-row-start: 1;

  flex-direction: column;
  display: flex;
  align-items: flex-end;

  @media (max-width: 720px) {
    align-items: flex-start;
    grid-column-start: 1;
    grid-row-start: 2;
    border-top: 1px solid #dcdde0;
    padding-top: 8px;
    margin-top: 8px;
  }
`;

const ActionsGridItem = styled.div.attrs({ 'data-cy': 'expense-actions' })`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  transition: opacity 0.05s;
  justify-content: flex-end;

  & > *:last-child {
    margin-right: 0;
  }

  grid-column-start: 2;
  grid-row-start: 2;

  @media (max-width: 720px) {
    justify-content: center;
    grid-column-start: 1;
    grid-column-end: span 2;
    grid-row-start: 4;
  }
`;

const ExpenseCheckGridItem = styled.div`
  grid-column-start: 3;
  grid-row-start: 2;
  margin-top: 8px;

  @media (max-width: 720px) {
    grid-column-start: 2;
    grid-row-start: 1;
  }
`;

const TagsGridItem = styled.div`
  grid-column-start: 1;
  grid-row-start: 2;

  @media (max-width: 720px) {
    grid-row-start: 3;
  }
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
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const useDrawer = LoggedInUser?.hasEarlyAccess('expense-drawer');

  const featuredProfile = isInverted ? expense?.account : expense?.payee;
  const isAdminView = view === 'admin';
  const isSubmitterView = view === 'submitter';
  const isCharge = expense?.type === expenseTypes.CHARGE;
  const pendingReceipt = isCharge && expense?.items?.every(i => i.url === null);
  const files = React.useMemo(() => getFilesFromExpense(expense, intl), [expense]);
  const nbAttachedFiles = !isAdminView ? 0 : files.length;
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
      <ExpenseBlockGrid>
        <SummaryGridItem>
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

              <P mt="4px" lineHeight="20px" fontSize="14px" color="black.700">
                <FormattedMessage
                  defaultMessage="From {payee} to {account}"
                  values={{
                    payee: <LinkCollective collective={expense.payee} />,
                    account: <LinkCollective collective={expense.account} />,
                  }}
                />
              </P>
              <P mt="8px" lineHeight="20px" fontSize="14px" color="black.700">
                <FormattedMessage
                  defaultMessage="On {shortDate}"
                  values={{
                    shortDate: <DateTime value={expense.createdAt} dateStyle={undefined} timeStyle={undefined} />,
                  }}
                />
                {isAdminView && Boolean(expense?.comments?.totalCount) && (
                  <React.Fragment>
                    {' • '}
                    <CommentIcon size={14} color="#4D4F51" />
                    &nbsp;
                    {expense?.comments.totalCount}
                  </React.Fragment>
                )}
              </P>
              <P lineHeight="20px" fontSize="14px" mt="8px" color="black.700">
                {nbAttachedFiles > 0 && (
                  <Box mr={[3, 4]}>
                    {isLoading ? (
                      <LoadingPlaceholder height={15} width={90} />
                    ) : (
                      <StyledLink textDecoration="underline" cursor="pointer" onClick={() => setShowFilesViewerModal(true)}>
                        <FormattedMessage
                          id="ExepenseAttachments.count"
                          defaultMessage="Attachments ({count})"
                          values={{ count: nbAttachedFiles }}
                        />
                      </StyledLink>
                    )}
                  </Box>
                )}
              </P>
            </Box>
          )}
        </SummaryGridItem>
        <DetailsGridItem>
          <Flex my={2} mr={[3, 0]} flexDirection="column" minWidth={100} data-cy="transaction-amount">
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
                <ExpenseTypeTag
                  type={expense.type}
                  legacyId={expense.legacyId}
                  mb={0}
                  py={0}
                  mr="2px"
                  fontSize="12px"
                  fontWeight="500"
                  color="black.700"
                />
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
        </DetailsGridItem>
        <ActionsGridItem>
          {showProcessActions && !isLoading && expense?.permissions && !isExpensePaidOrRejected && (
            <ProcessExpenseButtons
              host={host}
              isViewingExpenseInHostContext={isViewingExpenseInHostContext}
              collective={expense.account}
              expense={expense}
              permissions={expense.permissions}
              buttonProps={{ ...DEFAULT_PROCESS_EXPENSE_BTN_PROPS, mx: 1, py: 2 }}
              onSuccess={onProcess}
              displaySecurityChecks={false}
            />
          )}
        </ActionsGridItem>
        <ExpenseCheckGridItem>
          {showProcessActions && !isLoading && expense?.securityChecks?.length > 0 && (
            <SecurityChecksButton minWidth={0} expense={expense} />
          )}
        </ExpenseCheckGridItem>
        <TagsGridItem>
          <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center" mt={2}>
            <Box mt={2}>
              {!(isAdminView || isSubmitterView) && (
                <Tags
                  expense={expense}
                  canEdit={get(expense, 'permissions.canEditTags', false)}
                  suggestedTags={suggestedTags}
                />
              )}
            </Box>
          </Flex>
        </TagsGridItem>
      </ExpenseBlockGrid>

      {showFilesViewerModal && (
        <FilesViewerModal
          files={files}
          parentTitle={intl.formatMessage(
            {
              defaultMessage: 'Expense #{expenseId} attachment',
            },
            { expenseId: expense.legacyId },
          )}
          onClose={() => setShowFilesViewerModal(false)}
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
    securityChecks: PropTypes.array,
  }),
  selected: PropTypes.bool,
  expandExpense: PropTypes.func,
};

ExpenseBudgetItem.defaultProps = {
  view: 'public',
};

export default ExpenseBudgetItem;
