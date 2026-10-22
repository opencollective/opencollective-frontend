import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../test/providers';

import UploadedFilePreview from './UploadedFilePreview';

const CSV_URL = 'https://rest.opencollective.com/v2/platform-tips/transactions.csv?fetchAll=1';

describe('UploadedFilePreview', () => {
  it('opens CSV files in the file viewer, from the mouse or the keyboard', () => {
    const openFileViewer = jest.fn();
    render(
      withRequiredProviders(
        <UploadedFilePreview url={CSV_URL} fileName="transactions.csv" showFileName openFileViewer={openFileViewer} />,
      ),
    );

    const thumbnail = screen.getByRole('button', { name: /transactions\.csv/ });
    expect(thumbnail).toHaveAttribute('tabindex', '0');

    fireEvent.click(thumbnail);
    fireEvent.keyDown(thumbnail, { key: 'Enter' });
    fireEvent.keyDown(thumbnail, { key: ' ' });
    fireEvent.keyDown(thumbnail, { key: 'a' });
    expect(openFileViewer).toHaveBeenCalledTimes(3);
    expect(openFileViewer).toHaveBeenCalledWith(CSV_URL);
  });

  it('links to CSV files when there is no file viewer', () => {
    render(withRequiredProviders(<UploadedFilePreview url={CSV_URL} fileName="transactions.csv" showFileName />));

    expect(screen.getByRole('link', { name: /transactions\.csv/ })).toHaveAttribute('href', CSV_URL);
  });
});
