import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { saveInvoice } from '../../../lib/transactions';
import { withRequiredProviders } from '../../../test/providers';

import PaymentReceipts, { type InvoiceData, invoicesQuery } from './PaymentReceipts';

dayjs.extend(utc);

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../../lib/transactions', () => ({
  saveInvoice: jest.fn().mockResolvedValue(undefined),
}));

// Avatar uses styled-system internals; stub it to keep tests lightweight
jest.mock('../../Avatar', () => ({
  __esModule: true,
  default: ({ collective }: { collective: { slug: string } }) => (
    <img data-testid={`avatar-${collective.slug}`} alt={collective.slug} />
  ),
}));

// Replace Radix UI Select with a plain <select> for reliable jsdom interaction
jest.mock('../../ui/Select', () => {
  const Select = ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <select data-testid="period-select" value={value} onChange={e => onValueChange(e.target.value)} disabled={disabled}>
      {children}
    </select>
  );
  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <React.Fragment>{children}</React.Fragment>;
  const SelectValue = () => null;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <React.Fragment>{children}</React.Fragment>;
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COLLECTIVE_SLUG = 'my-org';

const makeInvoice = (
  year: number,
  month: number,
  hostSlug = 'osc',
  hostName = 'Open Source Collective',
): InvoiceData => ({
  slug: `${hostSlug}-${year}-${month}`,
  year,
  month,
  totalAmount: 10000,
  totalTransactions: 3,
  currency: 'USD',
  fromCollective: { id: 1, slug: COLLECTIVE_SLUG },
  host: { id: 10, slug: hostSlug, name: hostName, imageUrl: '' },
});

// Two 2023 invoices (different months, same host)
const INVOICES_2023 = [makeInvoice(2023, 3), makeInvoice(2023, 11)];

// Recent invoice guaranteed to fall within the "Past 12 months" window
const THIS_YEAR = new Date().getFullYear();
const LAST_MONTH = new Date().getMonth() === 0 ? 12 : new Date().getMonth(); // 1-indexed
const RECENT_YEAR = new Date().getMonth() === 0 ? THIS_YEAR - 1 : THIS_YEAR;
const RECENT_INVOICE = makeInvoice(RECENT_YEAR, LAST_MONTH);

const buildQueryMock = (invoices: InvoiceData[]) => ({
  request: {
    query: invoicesQuery,
    variables: { fromCollectiveSlug: COLLECTIVE_SLUG },
  },
  result: { data: { allInvoices: invoices } },
});

const renderPaymentReceipts = (invoices: InvoiceData[]) => {
  const ui = (
    <MockedProvider mocks={[buildQueryMock(invoices)]} addTypename={false}>
      <PaymentReceipts collective={{ slug: COLLECTIVE_SLUG }} />
    </MockedProvider>
  );
  return render(withRequiredProviders(ui));
};

// Helpers to compute the exact ISO strings produced by the component
const monthlyDateRange = (year: number, month: number) => {
  const dateMonth = dayjs.utc(`${year}-${month}`, 'YYYY-M');
  return { dateFrom: dateMonth.toISOString(), dateTo: dateMonth.endOf('month').toISOString() };
};

const yearlyDateRange = (year: number) => ({
  dateFrom: dayjs.utc(`${year}-01-01`).startOf('day').toISOString(),
  dateTo: dayjs.utc(`${year}-12-31`).endOf('day').toISOString(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PaymentReceipts', () => {
  const mockSaveInvoice = jest.mocked(saveInvoice);

  beforeEach(() => {
    mockSaveInvoice.mockClear();
  });

  // ---- Rendering -----------------------------------------------------------

  describe('rendering', () => {
    it('shows a loading skeleton while the query is in flight', () => {
      renderPaymentReceipts([RECENT_INVOICE]);
      // Skeleton divs are rendered before data arrives
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows an empty-state message when no invoices are returned', async () => {
      renderPaymentReceipts([]);
      await waitFor(() => expect(screen.getByText('No receipts available in this period.')).toBeInTheDocument());
    });

    it('renders monthly cards in the default "Past 12 months" view', async () => {
      renderPaymentReceipts([RECENT_INVOICE]);
      await waitFor(() => expect(screen.getByText(/Open Source Collective/i)).toBeInTheDocument());
      // Annual section must NOT appear in the default view
      expect(screen.queryByText(/Annual Receipts/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download receipt/i })).toBeInTheDocument();
    });

    it('populates the year options from the returned invoices', async () => {
      renderPaymentReceipts(INVOICES_2023);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      const select = screen.getByTestId('period-select') as HTMLSelectElement;
      const optionValues = Array.from(select.options).map(o => o.value);
      expect(optionValues).toContain('PAST_12_MONTHS');
      expect(optionValues).toContain('2023');
    });
  });

  // ---- Year filter ---------------------------------------------------------

  describe('year filter', () => {
    it('shows the annual receipts section and "Monthly breakdown" divider when a year is selected', async () => {
      renderPaymentReceipts(INVOICES_2023);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: '2023' } });

      await waitFor(() => expect(screen.getByText(/2023 Annual Receipts/i)).toBeInTheDocument());
      expect(screen.getByText(/Monthly breakdown/i)).toBeInTheDocument();
    });

    it('hides the annual section when switching back to "Past 12 months"', async () => {
      renderPaymentReceipts(INVOICES_2023);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: '2023' } });
      await waitFor(() => expect(screen.getByText(/2023 Annual Receipts/i)).toBeInTheDocument());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: 'PAST_12_MONTHS' } });
      await waitFor(() => expect(screen.queryByText(/Annual Receipts/i)).not.toBeInTheDocument());
      expect(screen.queryByText(/Monthly breakdown/i)).not.toBeInTheDocument();
    });

    it('renders one annual download button per fiscal host', async () => {
      const twoHostInvoices = [makeInvoice(2023, 3, 'host-a', 'Host A'), makeInvoice(2023, 5, 'host-b', 'Host B')];
      renderPaymentReceipts(twoHostInvoices);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: '2023' } });
      await waitFor(() => expect(screen.getByText(/2023 Annual Receipts/i)).toBeInTheDocument());

      expect(screen.getByTestId('download-annual-receipt-host-a')).toBeInTheDocument();
      expect(screen.getByTestId('download-annual-receipt-host-b')).toBeInTheDocument();
    });
  });

  // ---- PDF endpoint parameters ---------------------------------------------

  describe('PDF endpoint parameters', () => {
    it('calls saveInvoice with the start and end of the calendar month for a monthly download', async () => {
      renderPaymentReceipts([RECENT_INVOICE]);
      await waitFor(() => expect(screen.getByRole('button', { name: /download receipt/i })).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /download receipt/i }));

      const { dateFrom, dateTo } = monthlyDateRange(RECENT_YEAR, LAST_MONTH);
      await waitFor(() =>
        expect(mockSaveInvoice).toHaveBeenCalledWith({
          fromCollectiveSlug: COLLECTIVE_SLUG,
          toCollectiveSlug: 'osc',
          dateFrom,
          dateTo,
        }),
      );
    });

    it('calls saveInvoice with Jan 1 – Dec 31 for the annual download', async () => {
      const year = 2023;
      renderPaymentReceipts(INVOICES_2023);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: String(year) } });
      await waitFor(() => expect(screen.getByTestId('download-annual-receipt-osc')).toBeInTheDocument());

      await userEvent.click(screen.getByTestId('download-annual-receipt-osc'));

      const { dateFrom, dateTo } = yearlyDateRange(year);
      await waitFor(() =>
        expect(mockSaveInvoice).toHaveBeenCalledWith({
          fromCollectiveSlug: COLLECTIVE_SLUG,
          toCollectiveSlug: 'osc',
          dateFrom,
          dateTo,
        }),
      );
    });

    it('uses the exact year boundaries: dateFrom is Jan 1 00:00:00 UTC, dateTo is Dec 31 23:59:59 UTC', async () => {
      const year = 2023;
      renderPaymentReceipts(INVOICES_2023);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: String(year) } });
      await waitFor(() => expect(screen.getByTestId('download-annual-receipt-osc')).toBeInTheDocument());

      await userEvent.click(screen.getByTestId('download-annual-receipt-osc'));

      await waitFor(() => expect(mockSaveInvoice).toHaveBeenCalled());
      const { dateFrom, dateTo } = mockSaveInvoice.mock.calls[0][0] as {
        dateFrom: string;
        dateTo: string;
      };
      expect(dateFrom).toBe('2023-01-01T00:00:00.000Z');
      expect(dateTo).toBe('2023-12-31T23:59:59.999Z');
      expect(new Date(dateFrom).getTime()).toBeLessThan(new Date(dateTo).getTime());
    });

    it('uses the correct host slug as toCollectiveSlug for each annual download', async () => {
      const twoHostInvoices = [makeInvoice(2023, 3, 'host-a', 'Host A'), makeInvoice(2023, 5, 'host-b', 'Host B')];
      renderPaymentReceipts(twoHostInvoices);
      await waitFor(() => expect(screen.getByTestId('period-select')).not.toBeDisabled());

      fireEvent.change(screen.getByTestId('period-select'), { target: { value: '2023' } });
      await waitFor(() => {
        expect(screen.getByTestId('download-annual-receipt-host-a')).toBeInTheDocument();
        expect(screen.getByTestId('download-annual-receipt-host-b')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('download-annual-receipt-host-a'));
      await userEvent.click(screen.getByTestId('download-annual-receipt-host-b'));

      await waitFor(() => expect(mockSaveInvoice).toHaveBeenCalledTimes(2));
      const slugsCalled = mockSaveInvoice.mock.calls.map(
        ([args]) => (args as { toCollectiveSlug: string }).toCollectiveSlug,
      );
      expect(slugsCalled).toContain('host-a');
      expect(slugsCalled).toContain('host-b');
    });
  });
});
