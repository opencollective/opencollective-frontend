import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { withRequiredProviders } from '../../../test/providers';

import { InviteeAccountType } from '../useExpenseForm';

import { InviteUserOption } from './InviteUserOption';

describe('InviteUserOption organization slug', () => {
  it('keeps a custom slug when the org name is edited after the slug was touched', () => {
    const initialValues = {
      inviteeAccountType: InviteeAccountType.ORGANIZATION,
      inviteeNewOrganization: {
        organization: { name: '', slug: '', website: '', description: '' },
        name: '',
        email: '',
      },
      inviteNote: '',
    };
    let latest: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    render(
      withRequiredProviders(
        <Formik initialValues={initialValues} onSubmit={() => {}}>
          {formik => {
            latest = formik;
            return (
              <InviteUserOption
                setFieldValue={formik.setFieldValue as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                isSubmitting={false}
                inviteeAccountType={formik.values.inviteeAccountType}
                lockedFields={[]}
              />
            );
          }}
        </Formik>,
      ),
    );

    const nameInput = document.getElementById('input-inviteeNewOrganization.organization.name') as HTMLInputElement;
    const slugInput = document.getElementById('input-inviteeNewOrganization.organization.slug') as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    expect(slugInput).toBeTruthy();

    fireEvent.change(nameInput, { target: { value: 'Acme' } });
    expect(slugInput.value).toBe('acme');

    fireEvent.change(slugInput, { target: { value: 'my-custom' } });
    fireEvent.blur(slugInput);
    expect(latest.touched.inviteeNewOrganization?.organization?.slug).toBe(true);
    expect(slugInput.value).toBe('my-custom');

    fireEvent.change(nameInput, { target: { value: 'Acme Corp' } });
    expect(screen.getByDisplayValue('Acme Corp')).toBeTruthy();
    expect(latest.values.inviteeNewOrganization.organization.slug).toBe('my-custom');
  });
});
