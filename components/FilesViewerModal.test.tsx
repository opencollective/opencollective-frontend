import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../test/providers';

import FilesViewerModal from './FilesViewerModal';

const REST_URL = 'https://rest.test';

const renderModal = (files: React.ComponentProps<typeof FilesViewerModal>['files']) =>
  render(withRequiredProviders(<FilesViewerModal files={files} onClose={jest.fn()} />));

describe('FilesViewerModal', () => {
  const originalRestUrl = process.env.REST_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.REST_URL = REST_URL;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'kind,amount\nTIP,1.00\n' });
  });

  afterEach(() => {
    process.env.REST_URL = originalRestUrl;
    global.fetch = originalFetch;
  });

  it('previews CSV links without file info (e.g. settlement exports) as a table', async () => {
    renderModal([{ url: `${REST_URL}/v2/platform-tips/transactions.csv?fetchAll=1`, name: 'transactions.csv' }]);

    expect(await screen.findByRole('cell', { name: 'TIP' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('previews relative CSV links without file info as a table', async () => {
    renderModal([{ url: '/api/files/report.csv', name: 'report.csv' }]);

    expect(await screen.findByRole('cell', { name: 'TIP' })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      `${window.location.origin}/api/files/report.csv`,
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('shows a fallback card for files that cannot be previewed', () => {
    renderModal([{ url: 'https://example.com/files/report', name: 'Report.docx', type: 'application/msword' }]);

    expect(screen.getByText('Preview is not available for this file.')).toBeInTheDocument();
    expect(screen.getByText('Report.docx', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in new window' })).toHaveAttribute(
      'href',
      'https://example.com/files/report',
    );
  });

  it('shows a fallback card when an image fails to load', () => {
    renderModal([{ url: 'https://example.com/files/receipt', name: 'Receipt' }]);

    fireEvent.error(screen.getByRole('img', { name: 'Receipt' }));
    expect(screen.getByText('Preview is not available for this file.')).toBeInTheDocument();
  });
});
