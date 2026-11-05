import React from 'react';
import { render, screen } from '@testing-library/react';

import { LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { withRequiredProviders } from '../test/providers';

import CSVPreview, { CSV_PREVIEW_MAX_BYTES, CSV_PREVIEW_MAX_ROWS } from './CSVPreview';

const REST_URL = 'https://rest.test';
const SETTLEMENT_CSV_URL = `${REST_URL}/v2/platform-tips/transactions.csv?kind=PLATFORM_TIP&fetchAll=1`;

const mockFetchResponse = (body: string, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, text: async () => body });
};

/** Mocks a response whose body is read as a stream of the given chunks */
const mockStreamedFetchResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  const reader = { read: jest.fn(), cancel: jest.fn().mockResolvedValue(undefined) };
  chunks.forEach(chunk => reader.read.mockResolvedValueOnce({ done: false, value: encoder.encode(chunk) }));
  reader.read.mockResolvedValue({ done: true, value: undefined });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: { getReader: () => reader } });
  return reader;
};

const renderPreview = (url: string) =>
  render(
    withRequiredProviders(
      <CSVPreview url={url} renderFallback={() => <div data-testid="fallback">Preview is not available</div>} />,
    ),
  );

describe('CSVPreview', () => {
  const originalRestUrl = process.env.REST_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.REST_URL = REST_URL;
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, 'user-token');
  });

  afterEach(() => {
    process.env.REST_URL = originalRestUrl;
    global.fetch = originalFetch;
    window.localStorage.clear();
  });

  it('renders the CSV as a table, fetching from the REST service with the access token', async () => {
    mockFetchResponse('date,description,amount\n2026-09-02,Platform tip,12.50\n2026-09-03,"Tip, with comma",-3.00\n');
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByRole('columnheader', { name: 'description' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Tip, with comma' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '12.50' })).toHaveClass('text-right');
    expect(screen.getByText('2 rows')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      SETTLEMENT_CSV_URL,
      expect.objectContaining({ headers: { Authorization: 'Bearer user-token' } }),
    );
  });

  it('renders HTML in cells as text', async () => {
    mockFetchResponse('name,note\n<b>bold</b>,<script>window.pwned = true</script>\n');
    const { container } = renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByRole('cell', { name: '<script>window.pwned = true</script>' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '<b>bold</b>' })).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
  });

  it('only renders the first rows of large files', async () => {
    const rows = Array.from({ length: CSV_PREVIEW_MAX_ROWS + 50 }, (_, idx) => `row-${idx},${idx}`);
    mockFetchResponse(['label,value', ...rows].join('\n'));
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByText(/Showing the first 500 rows/)).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: `row-${CSV_PREVIEW_MAX_ROWS - 1}` })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: `row-${CSV_PREVIEW_MAX_ROWS}` })).not.toBeInTheDocument();
  });

  it('stops reading large files once the preview rows are available', async () => {
    const chunks = Array.from({ length: 20 }, (_, chunkIdx) =>
      Array.from({ length: 100 }, (_, idx) => `row-${chunkIdx * 100 + idx},${idx}\n`).join(''),
    );
    const reader = mockStreamedFetchResponse(['label,value\n', ...chunks]);
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByText(/Showing the first 500 rows/)).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: `row-${CSV_PREVIEW_MAX_ROWS - 1}` })).toBeInTheDocument();
    expect(reader.read.mock.calls.length).toBeLessThan(chunks.length);
    expect(reader.cancel).toHaveBeenCalled();
  });

  it('parses quoted values split across chunks', async () => {
    mockStreamedFetchResponse(['name,note\n"Tip","first', ' line\nsecond line"\n', 'Fee,-1.00\n']);
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByRole('cell', { name: 'Fee' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /first line\s+second line/ })).toBeInTheDocument();
    expect(screen.getByText('2 rows')).toBeInTheDocument();
  });

  it('renders the fallback when the preview rows are not found within the size limit', async () => {
    const reader = mockStreamedFetchResponse([`label,value\n"${'x'.repeat(CSV_PREVIEW_MAX_BYTES)}`, 'never read']);
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByTestId('fallback')).toBeInTheDocument();
    expect(reader.read).toHaveBeenCalledTimes(1);
    expect(reader.cancel).toHaveBeenCalled();
  });

  it('renders the fallback when the file cannot be fetched', async () => {
    mockFetchResponse('Unauthorized', 403);
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the fallback for empty files', async () => {
    mockFetchResponse('');
    renderPreview(SETTLEMENT_CSV_URL);

    expect(await screen.findByTestId('fallback')).toBeInTheDocument();
  });

  it('fetches uploaded files from this website without the access token', async () => {
    mockFetchResponse('a,b\n1,2\n');
    renderPreview(`${window.location.origin}/api/files/file-123`);

    expect(await screen.findByRole('cell', { name: '1' })).toBeInTheDocument();
    const [, fetchParams] = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchParams.credentials).toBe('same-origin');
    expect(fetchParams.headers).toBeUndefined();
  });

  it('does not fetch files from other origins', async () => {
    mockFetchResponse('a,b\n1,2\n');
    renderPreview('https://attacker.example/transactions.csv');

    expect(await screen.findByTestId('fallback')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
