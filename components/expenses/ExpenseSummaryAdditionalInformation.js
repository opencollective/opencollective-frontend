import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatAccountName } from '../../lib/collective';
import { CollectiveType } from '../../lib/constants/collectives';
import expenseTypes from '../../lib/constants/expenseTypes';
import { INVITE, PayoutMethodType, VIRTUAL_CARD } from '../../lib/constants/payout-method';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../lib/i18n/collective-type';
import { getDashboardRoute } from '../../lib/url-helpers';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import LocationAddress from '../LocationAddress';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
import { H4, P, Span } from '../Text';

import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';

const CreatedByUserLink = ({ account }) => {
  return (
    <LinkCollective collective={account}>
      <Span color="black.800" fontWeight={500} textDecoration="none">
        {account ? account.name : <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />}
      </Span>
    </LinkCollective>
  );
};

CreatedByUserLink.propTypes = {
  account: PropTypes.object,
};

const PrivateInfoColumn = styled(Box).attrs({ flexBasis: [0, '185px'] })`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  flex: 1 1;
  min-width: 160px;
`;

const PrivateInfoColumnHeader = styled(H4).attrs({
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase',
  color: 'black.700',
  mb: 3,
  letterSpacing: '0.06em',
  lineHeight: '16px',
})``;

const PayeeTotalPayoutSumTooltip = ({ stats }) => {
  const currentYear = new Date().getFullYear().toString();
  return (
    <StyledTooltip
      content={() => (
        <FormattedMessage
          defaultMessage="Total expense payouts ({currentYear}): Invoices: {totalPaidInvoices}; Receipts: {totalPaidReceipts}; Grants: {totalPaidGrants}"
          id="uF45hs"
          values={{
            totalPaidInvoices: (
              <FormattedMoneyAmount
                amount={stats.totalPaidInvoices.valueInCents}
                currency={stats.totalPaidInvoices.currency}
                precision={2}
                amountStyles={null}
              />
            ),
            totalPaidReceipts: (
              <FormattedMoneyAmount
                amount={stats.totalPaidReceipts.valueInCents}
                currency={stats.totalPaidReceipts.currency}
                precision={2}
                amountStyles={null}
              />
            ),
            totalPaidGrants: (
              <FormattedMoneyAmount
                amount={stats.totalPaidGrants.valueInCents}
                currency={stats.totalPaidGrants.currency}
                precision={2}
                amountStyles={null}
              />
            ),
            currentYear: <span>{currentYear}</span>,
          }}
        />
      )}
    >
      <InfoCircle size={16} />
    </StyledTooltip>
  );
};

const ExpenseSummaryAdditionalInformation = ({
  expense,
  host,
  isLoading,
  isLoadingLoggedInUser,
  isDraft,
  collective,
}) => {
  const intl = useIntl();
  const payeeLocation = expense?.payeeLocation || expense?.draft?.payeeLocation;
  const payee = isDraft ? expense?.draft?.payee : expense?.payee;
  const payeeStats = payee && !isDraft ? payee.stats : null; // stats not available for drafts
  const isInvoice = expense?.type === expenseTypes.INVOICE;
  const isCharge = expense?.type === expenseTypes.CHARGE;
  const isPaid = expense?.status === ExpenseStatus.PAID;

  if (isLoading) {
    return <LoadingPlaceholder height={150} mt={3} />;
  }

  if (!payee) {
    return null;
  }

  return (
    <Flex
      flexDirection={['column', 'row']}
      alignItems={['stretch', 'flex-start']}
      flexWrap={['nowrap', 'wrap', null, 'nowrap']}
      gridGap="12px"
    >
      {collective && (
        <PrivateInfoColumn data-cy="expense-summary-collective">
          <PrivateInfoColumnHeader>{formatCollectiveType(intl, collective.type)}</PrivateInfoColumnHeader>
          <AccountHoverCard
            account={collective}
            trigger={
              <span>
                <LinkCollective collective={collective} noTitle>
                  <Flex alignItems="center">
                    <Avatar collective={collective} radius={24} />
                    <Flex flexDirection="column" ml={2} mr={2} css={{ overflow: 'hidden' }}>
                      <Span color="black.800" fontSize="14px" fontWeight="700">
                        {formatAccountName(collective.name, collective.legalName)}
                      </Span>
                      <Span color="black.900" fontSize="13px">
                        @{collective.slug}
                      </Span>
                    </Flex>
                  </Flex>
                </LinkCollective>
              </span>
            }
          />

          {collective.stats.balanceWithBlockedFunds && (
            <Container mt={2} fontSize="14px" color="black.700">
              <Container fontWeight="700">
                <FormattedMessage
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{ item: <FormattedMessage id="Balance" defaultMessage="Balance" /> }}
                />
              </Container>
              <Box mt={2}>
                <FormattedMoneyAmount
                  amount={collective.stats.balanceWithBlockedFunds.valueInCents}
                  currency={collective.stats.balanceWithBlockedFunds.currency}
                  amountStyles={null}
                />
              </Box>
            </Container>
          )}
          {Boolean(collective?.hostAgreements?.totalCount) && (
            <Container mt={3}>
              <StyledLink
                fontWeight="700"
                color="black.700"
                textDecoration="underline"
                fontSize="14px"
                href={`${getDashboardRoute(host, 'host-agreements')}?account=${collective.slug}`}
              >
                <FormattedMessage
                  defaultMessage="Host Agreements: <Color>{agreementsCount}</Color>"
                  id="uX+lpu"
                  values={{
                    Color: text => <Span color="primary.600">{text}</Span>,
                    agreementsCount: collective.hostAgreements.totalCount,
                  }}
                />
              </StyledLink>
            </Container>
          )}
        </PrivateInfoColumn>
      )}
      <PrivateInfoColumn data-cy="expense-summary-payee">
        <PrivateInfoColumnHeader>
          {isPaid ? (
            <FormattedMessage id="Expense.PaidTo" defaultMessage="Paid to" />
          ) : (
            <FormattedMessage id="Expense.PayTo" defaultMessage="Pay to" />
          )}
        </PrivateInfoColumnHeader>
        <AccountHoverCard
          account={payee}
          includeAdminMembership={{
            accountSlug: collective?.slug,
            hostSlug: host?.slug,
          }}
          trigger={
            <span>
              <LinkCollective collective={payee} noTitle>
                <Flex alignItems="center" fontSize="14px">
                  {!payee.slug ? (
                    <Avatar
                      name={payee.organization?.name || payee.name}
                      radius={24}
                      backgroundColor="blue.100"
                      color="blue.400"
                    />
                  ) : (
                    <Avatar collective={payee} radius={24} />
                  )}
                  <Flex flexDirection="column" ml={2} mr={2} css={{ overflow: 'hidden' }}>
                    <Span color="black.900" fontWeight="bold">
                      {formatAccountName(
                        payee.organization?.name || payee.name,
                        payee.organization?.legalName || payee.legalName,
                      )}
                    </Span>
                    {payee.type !== CollectiveType.VENDOR && (payee.organization?.slug || payee.slug) && (
                      <Span color="black.900" fontSize="13px">
                        @{payee.organization?.slug || payee.slug}
                      </Span>
                    )}
                  </Flex>
                  {payeeStats && <PayeeTotalPayoutSumTooltip stats={payeeStats} />}
                </Flex>
              </LinkCollective>
            </span>
          }
        />

        {payeeLocation && isInvoice && (
          <Container whiteSpace="pre-wrap" color="black.700" fontSize="14px" lineHeight="16px" mt={2}>
            <LocationAddress location={payeeLocation} isLoading={isLoadingLoggedInUser} />
          </Container>
        )}
        {payee.website && (
          <P mt={2} fontSize="14px">
            <StyledLink href={payee.website} openInNewTab>
              {payee.website}
            </StyledLink>
          </P>
        )}
      </PrivateInfoColumn>
      <PrivateInfoColumn mr={0}>
        <PrivateInfoColumnHeader>
          <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
        </PrivateInfoColumnHeader>
        <Container fontSize="14px" color="black.700">
          <Box mb={3} data-cy="expense-summary-payout-method-type">
            <PayoutMethodTypeWithIcon
              type={
                !expense.payoutMethod?.type && (expense.draft || expense.payee.isInvite)
                  ? expense.draft?.payoutMethod?.type || INVITE
                  : isCharge
                    ? VIRTUAL_CARD
                    : expense.payoutMethod?.type
              }
              name={expense?.virtualCard?.name && `${expense.virtualCard.name} Card (${expense.virtualCard.last4})`}
            />
          </Box>
          <Container data-cy="expense-summary-payout-method-data" wordBreak="break-word">
            <PayoutMethodData
              payoutMethod={expense.draft?.payoutMethod ?? expense.payoutMethod}
              isLoading={isLoadingLoggedInUser}
            />
          </Container>
          {expense.invoiceInfo && (
            <Box mt={3} data-cy="expense-summary-invoice-info">
              <Container fontSize="11px" fontWeight="500" mb={2}>
                <FormattedMessage id="ExpenseForm.InvoiceInfo" defaultMessage="Additional invoice information" />
                &nbsp;&nbsp;
                <PrivateInfoIcon />
              </Container>
              <P fontSize="11px" lineHeight="16px" whiteSpace="pre-wrap">
                {expense.invoiceInfo}
              </P>
            </Box>
          )}
        </Container>
      </PrivateInfoColumn>
    </Flex>
  );
};

PayeeTotalPayoutSumTooltip.propTypes = {
  stats: PropTypes.shape({
    totalPaidInvoices: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }).isRequired,
    totalPaidReceipts: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }).isRequired,
    totalPaidGrants: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }).isRequired,
  }),
};

ExpenseSummaryAdditionalInformation.propTypes = {
  /** Set this to true if the expense is not loaded yet */
  isLoading: PropTypes.bool,
  /** Set this to true if this shoud use information from expense.draft property */
  isDraft: PropTypes.bool,
  /** Set this to true if the logged in user is currenltly loading */
  isLoadingLoggedInUser: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  /** Must be provided if isLoading is false */
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    description: PropTypes.string,
    longDescription: PropTypes.string,
    currency: PropTypes.string,
    invoiceInfo: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.oneOf(Object.values(ExpenseStatus)),
    type: PropTypes.oneOf(Object.values(expenseTypes)),
    tags: PropTypes.arrayOf(PropTypes.string),
    requiredLegalDocuments: PropTypes.arrayOf(PropTypes.string),
    draft: PropTypes.shape({
      payee: PropTypes.object,
      payeeLocation: PropTypes.object,
      payoutMethod: PropTypes.object,
    }),
    payee: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      slug: PropTypes.string,
      type: PropTypes.string,
      isAdmin: PropTypes.bool,
      isInvite: PropTypes.bool,
      stats: PropTypes.shape({
        totalPaidInvoices: PropTypes.shape({
          valueInCents: PropTypes.number,
          currency: PropTypes.string,
        }).isRequired,
        totalPaidReceipts: PropTypes.shape({
          valueInCents: PropTypes.number,
          currency: PropTypes.string,
        }).isRequired,
        totalPaidGrants: PropTypes.shape({
          valueInCents: PropTypes.number,
          currency: PropTypes.string,
        }).isRequired,
      }),
    }),
    payeeLocation: PropTypes.shape({
      address: PropTypes.string,
      country: PropTypes.string,
    }),
    createdByAccount: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
      type: PropTypes.string,
    }),
    payoutMethod: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
      data: PropTypes.object,
    }),
    virtualCard: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      last4: PropTypes.string,
    }),
  }),
  collective: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    type: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    legalName: PropTypes.string,
    stats: PropTypes.shape({
      balanceWithBlockedFunds: PropTypes.object,
    }),
    hostAgreements: PropTypes.shape({
      totalCount: PropTypes.number,
    }),
  }),
};

export default ExpenseSummaryAdditionalInformation;
