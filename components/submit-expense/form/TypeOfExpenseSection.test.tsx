import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { PAYEE_SLUG_INVITE } from '../../expenses/lib/constants';
import { withRequiredProviders } from '../../../test/providers';

import { YesNoOption } from '../useExpenseForm';

import { InvoiceFormOption } from './TypeOfExpenseSection';

jest.mock('../../Dropzone', () => ({ MemoizedDropzone: () => null }));

const renderInvoiceForm = (isAdminOfPayee = false, payeeSlug = 'team-prime-consulting-ltd') => {
  render(
    withRequiredProviders(
      <Formik initialValues={{ invoiceNumber: '', invoiceFile: null }} onSubmit={jest.fn()}>
        <InvoiceFormOption
          {...{ isAdminOfPayee, payeeSlug }}
          setFieldValue={jest.fn()}
          initialLoading={false}
          isSubmitting={false}
          expenseTypeOption={ExpenseType.INVOICE}
          hasInvoiceOption={YesNoOption.YES}
        />
      </Formik>,
    ),
  );
};

describe('InvoiceFormOption', () => {
  it('marks the file as required even when the submitter is not a payee admin', () => {
    renderInvoiceForm();
    expect(screen.getByText('Attach your invoice file').closest('label')).not.toHaveTextContent('optional');
  });

  it('keeps the invoice reference optional for payee admins', () => {
    renderInvoiceForm(true);
    expect(screen.getByText('Invoice reference').closest('label')).toHaveTextContent('optional');
    expect(screen.getByRole('textbox')).not.toBeRequired();
  });

  it('allows the inviter to leave the invoice file for the invitee', () => {
    renderInvoiceForm(false, PAYEE_SLUG_INVITE);
    expect(screen.getByText('Attach your invoice file').closest('label')).toHaveTextContent('optional');
  });
});
