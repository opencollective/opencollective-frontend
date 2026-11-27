import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { act, render } from '@testing-library/react';
import { Formik } from 'formik';
import { IntlProvider } from 'react-intl';

import PayoutBankInformationForm from './PayoutBankInformationForm';

describe('PayoutBankInformationForm', () => {
  it('rejects an invoice below the Wise minimum amount of the selected currency', async () => {
    const host = {
      slug: 'host',
      currency: 'EUR',
      transferwise: { availableCurrencies: [{ code: 'EUR', minInvoiceAmount: 5 }] },
    };
    let formik;
    render(
      <IntlProvider locale="en">
        <MockedProvider mocks={[]}>
          <Formik
            initialValues={{
              items: [{ amountV2: { valueInCents: 100 } }],
              payoutMethod: { data: { currency: 'EUR' } },
            }}
            onSubmit={() => {}}
          >
            {props => {
              formik = props;
              return (
                <PayoutBankInformationForm isNew host={host} optional={false} getFieldName={f => `payoutMethod.${f}`} />
              );
            }}
          </Formik>
        </MockedProvider>
      </IntlProvider>,
    );
    let errors;
    await act(async () => {
      errors = await formik.validateForm();
    });
    expect(errors?.payoutMethod?.data?.currency).toMatch(/minimum amount for transferring to EUR/);
  });
});
