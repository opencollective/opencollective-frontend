import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import { CreateLegalEntityPayeeForm } from './CreateLegalEntityPayeeForm';

jest.mock('../../InputCountry', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <React.Fragment>
      <button type="button" data-testid="pick-JO" onClick={() => onChange('JO')}>
        JO
      </button>
      <button type="button" data-testid="pick-FR" onClick={() => onChange('FR')}>
        FR
      </button>
    </React.Fragment>
  ),
}));

describe('CreateLegalEntityPayeeForm', () => {
  it.each(['FR', 'JO'])('lets the user create an organization incorporated in %s', async country => {
    const createPayeeOrganization = jest.fn().mockResolvedValue({ slug: 'jordan-org' });
    render(
      withRequiredProviders(
        <CreateLegalEntityPayeeForm isSubmitting={false} createPayeeOrganization={createPayeeOrganization} />,
      ),
    );
    fireEvent.click(screen.getByTestId(`pick-${country}`));
    fireEvent.change(screen.getByPlaceholderText('e.g. Green Horizon Foundation, Inc.'), {
      target: { value: 'Amman Foundation LLC', name: 'legalName' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Green Horizon'), {
      target: { value: 'Amman Foundation', name: 'name' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    const button = screen.getByRole('button', { name: /Create Organization Account/ });
    await waitFor(() => expect(button).toBeEnabled(), { timeout: 3000 });
    fireEvent.click(button);
    await waitFor(() => expect(createPayeeOrganization).toHaveBeenCalled());
    expect(createPayeeOrganization.mock.calls[0][0]).toMatchObject({ countryISO: country });
  });
});
