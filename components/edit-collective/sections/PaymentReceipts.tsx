import React from 'react';
import { useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { groupBy, uniq } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V1_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';
import { saveInvoice } from '../../../lib/transactions';

import Avatar from '../../Avatar';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Button } from '../../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Skeleton } from '../../ui/Skeleton';

dayjs.extend(utc);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceHost = {
  id: number;
  slug: string;
  name: string;
  imageUrl: string;
};

export type InvoiceFromCollective = {
  id: number;
  slug: string;
};

export type InvoiceData = {
  slug: string;
  year: number;
  month: number;
  totalAmount: number;
  totalTransactions: number;
  currency: string;
  fromCollective: InvoiceFromCollective;
  host: InvoiceHost;
};

type FilterValue = 'PAST_12_MONTHS' | number;

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

export const invoicesQuery = gqlV1 /* GraphQL */ `
  query TransactionsDownloadInvoices($fromCollectiveSlug: String!) {
    allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
      slug
      year
      month
      totalAmount
      totalTransactions
      currency
      fromCollective {
        id
        slug
      }
      host {
        id
        slug
        name
        imageUrl
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const filterInvoices = (allInvoices: InvoiceData[], filterBy: FilterValue): InvoiceData[] => {
  if (filterBy === 'PAST_12_MONTHS') {
    const twelveMonthsAgo = dayjs().subtract(11, 'month');
    return allInvoices.filter(i => {
      const dateMonth = dayjs.utc(`${i.year}-${i.month}`, 'YYYY-M');
      return dateMonth.isAfter(twelveMonthsAgo);
    });
  }
  return allInvoices.filter(i => i.year === filterBy);
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

const ReceiptsLoadingPlaceholder = () => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-3">
      <Skeleton className="h-6 w-24 shrink-0" />
      <hr className="flex-1 border-t border-[#C4C7CC]" />
    </div>
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="my-3 flex items-center rounded-lg border bg-card px-6 py-3">
        <Skeleton className="mr-3 h-12 w-12 shrink-0 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48 sm:w-96" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const NoReceipts = () => (
  <div className="my-10 flex items-center justify-center">
    <div className="flex h-24 items-center justify-center rounded-lg border bg-card px-6 py-4">
      <h3 className="text-center text-sm leading-6 text-muted-foreground">
        <FormattedMessage id="paymentReceipt.noReceipts" defaultMessage="No receipts available in this period." />
      </h3>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Single receipt card (monthly)
// ---------------------------------------------------------------------------

type ReceiptCardProps = {
  invoice: InvoiceData;
  dateFrom: string;
  dateTo: string;
  loadingInvoice: boolean;
  downloadInvoice: (args: {
    fromCollectiveSlug: string;
    toCollectiveSlug: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
};

const ReceiptCard = ({ invoice, dateFrom, dateTo, loadingInvoice, downloadInvoice }: ReceiptCardProps) => (
  <div className="my-3 flex flex-col items-start justify-between gap-3 rounded-lg border bg-card px-6 py-3 sm:flex-row sm:items-center">
    <div className="flex items-center">
      <Avatar collective={invoice.host} borderRadius="16px" mr={3} size="48px" />
      <div>
        <p className="m-0 text-sm leading-7 font-medium tracking-[-0.16px] text-foreground sm:text-base">
          <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />: {invoice.host.name}
        </p>
        <span className="text-[10px] leading-[14px] font-normal text-muted-foreground sm:text-[15px] sm:leading-[21px] sm:tracking-[-0.1px]">
          {`${invoice.month}/${invoice.year}`} &mdash; {invoice.totalTransactions}{' '}
          <FormattedMessage
            id="paymentReceipt.transaction"
            values={{ n: invoice.totalTransactions }}
            defaultMessage="{n, plural, one {Transaction} other {Transactions}}"
          />
        </span>
      </div>
    </div>
    <Button
      variant="outline"
      size="xs"
      disabled={loadingInvoice}
      onClick={() =>
        downloadInvoice({
          fromCollectiveSlug: invoice.fromCollective.slug,
          toCollectiveSlug: invoice.host.slug,
          dateFrom,
          dateTo,
        })
      }
    >
      <FormattedMessage id="DownloadReceipt" defaultMessage="Download receipt" />
    </Button>
  </div>
);

// ---------------------------------------------------------------------------
// Monthly breakdown list
// ---------------------------------------------------------------------------

type MonthlyReceiptsProps = { invoices: InvoiceData[] };

const MonthlyReceipts = ({ invoices }: MonthlyReceiptsProps) => {
  const { loading: loadingInvoice, call: downloadInvoice } = useAsyncCall(saveInvoice, { useErrorToast: true });
  const byMonthYear = groupBy(invoices, i => `${i.month}-${i.year}`);

  return (
    <div className="flex flex-col">
      {Object.keys(byMonthYear).map(monthYear => {
        const first = byMonthYear[monthYear][0];
        const dateMonth = dayjs.utc(`${first.year}-${first.month}`, 'YYYY-M');
        const dateFrom = dateMonth.toISOString();
        const dateTo = dateMonth.endOf('month').toISOString();
        const [month, year] = monthYear.split('-');

        return (
          <div key={monthYear} className="flex flex-col">
            <div className="mt-3 flex items-center justify-between gap-3">
              <h3 className="shrink-0 text-base leading-6 font-medium text-foreground">
                <FormattedDate value={new Date(Number(year), Number(month) - 1)} month="long" year="numeric" />
              </h3>
              <hr className="w-3/5 flex-1 border-t border-[#C4C7CC] sm:w-4/5" />
            </div>
            {byMonthYear[monthYear].map(invoice => (
              <ReceiptCard
                key={`${invoice.year}-${invoice.month}-${invoice.slug}`}
                invoice={invoice}
                dateFrom={dateFrom}
                dateTo={dateTo}
                loadingInvoice={loadingInvoice}
                downloadInvoice={downloadInvoice}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Year summary — one card per host with a single yearly download
// ---------------------------------------------------------------------------

type YearSummaryProps = { invoices: InvoiceData[]; year: number };

const YearSummary = ({ invoices, year }: YearSummaryProps) => {
  const { loading: loadingInvoice, call: downloadInvoice } = useAsyncCall(saveInvoice, { useErrorToast: true });
  const byHost = groupBy(invoices, i => i.host.slug);

  const yearDateFrom = dayjs.utc(`${year}-01-01`).startOf('day').toISOString();
  const yearDateTo = dayjs.utc(`${year}-12-31`).endOf('day').toISOString();

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold tracking-wide uppercase">
          <FormattedMessage
            id="paymentReceipts.annualReceipts"
            defaultMessage="{year} Annual Receipts"
            values={{ year }}
          />
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {Object.values(byHost).map(hostInvoices => {
          const host = hostInvoices[0].host;
          const fromCollective = hostInvoices[0].fromCollective;
          const totalTransactions = hostInvoices.reduce((sum, i) => sum + i.totalTransactions, 0);

          return (
            <div
              key={host.slug}
              className="flex flex-col items-start justify-between gap-3 rounded-lg border border-blue-100 bg-white px-5 py-3 sm:flex-row sm:items-center dark:border-blue-900/40 dark:bg-card"
            >
              <div className="flex items-center">
                <Avatar collective={host} borderRadius="16px" mr={3} size="48px" />
                <div>
                  <p className="m-0 text-sm leading-7 font-medium tracking-[-0.16px] text-foreground sm:text-base">
                    <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />: {host.name}
                  </p>
                  <span className="text-[10px] leading-[14px] font-normal text-muted-foreground sm:text-[15px] sm:leading-[21px] sm:tracking-[-0.1px]">
                    {year} &mdash; {totalTransactions}{' '}
                    <FormattedMessage
                      id="paymentReceipt.transaction"
                      values={{ n: totalTransactions }}
                      defaultMessage="{n, plural, one {Transaction} other {Transactions}}"
                    />
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                disabled={loadingInvoice}
                data-testid={`download-annual-receipt-${host.slug}`}
                onClick={() =>
                  downloadInvoice({
                    fromCollectiveSlug: fromCollective.slug,
                    toCollectiveSlug: host.slug,
                    dateFrom: yearDateFrom,
                    dateTo: yearDateTo,
                  })
                }
              >
                <FormattedMessage
                  id="paymentReceipts.downloadYearReceipt"
                  defaultMessage="Download {year} receipt"
                  values={{ year: String(year) }}
                />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type PaymentReceiptsProps = {
  collective: { slug: string };
};

const PAST_12_MONTHS = 'PAST_12_MONTHS';

const PaymentReceipts = ({ collective }: PaymentReceiptsProps) => {
  const [activeFilter, setActiveFilter] = React.useState<string>(PAST_12_MONTHS);

  const { data, loading, error } = useQuery(invoicesQuery, {
    context: API_V1_CONTEXT,
    variables: { fromCollectiveSlug: collective.slug },
  });

  const availableYears: number[] = (uniq((data?.allInvoices ?? []).map((i: InvoiceData) => i.year)) as number[]).sort(
    (a, b) => b - a,
  );

  const filterValue: FilterValue = activeFilter === PAST_12_MONTHS ? PAST_12_MONTHS : Number(activeFilter);
  const invoices: InvoiceData[] = data ? filterInvoices(data.allInvoices, filterValue) : [];

  let content: React.ReactNode = null;
  if (loading) {
    content = <ReceiptsLoadingPlaceholder />;
  } else if (error) {
    content = <MessageBoxGraphqlError error={error} />;
  } else if (invoices.length === 0) {
    content = <NoReceipts />;
  } else {
    const isCurrentYear = activeFilter === PAST_12_MONTHS || Number(activeFilter) === dayjs().year();
    content = (
      <React.Fragment>
        {!isCurrentYear && (
          <React.Fragment>
            <YearSummary invoices={invoices} year={Number(activeFilter)} />
            <div className="my-6 flex items-center gap-3">
              <span className="shrink-0 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <FormattedMessage id="paymentReceipts.monthlyBreakdown" defaultMessage="Monthly breakdown" />
              </span>
              <hr className="flex-1 border-t border-border" />
            </div>
          </React.Fragment>
        )}
        <MonthlyReceipts invoices={invoices} />
      </React.Fragment>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="mt-2 text-sm leading-[21px] text-muted-foreground">
        <FormattedMessage
          id="paymentReceipts.section.description"
          defaultMessage="Consolidated receipts for your financial contributions."
        />
      </p>
      <div className="mt-4">
        <p className="mb-1 text-[9px] leading-3 font-medium tracking-[0.06em] text-foreground uppercase">
          <FormattedMessage id="paymentReceipts.selectDate.label" defaultMessage="Time period" />
        </p>
        <Select value={activeFilter} onValueChange={setActiveFilter} disabled={loading}>
          <SelectTrigger className="w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PAST_12_MONTHS}>
              <FormattedMessage id="paymentReceipts.filter.past12Months" defaultMessage="Past 12 months" />
            </SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-6">{content}</div>
      </div>
    </div>
  );
};

export default PaymentReceipts;
