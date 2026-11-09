import React from 'react';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Formik, useFormikContext } from 'formik';
import { noop } from 'lodash-es';
import { FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '@/lib/graphql/types/v2/graphql';

import { validatePayoutMethod } from '@/components/expenses/PayoutMethodForm';
import { NewPayoutMethodOption } from '@/components/submit-expense/form/PayoutMethodSection';
import type { ExpenseForm, ExpenseFormValues } from '@/components/submit-expense/useExpenseForm';
import { useExpenseFormActions } from '@/components/submit-expense/useExpenseFormActions';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/Dialog';

const NEW_PAYOUT_METHOD_TYPES = [PayoutMethodType.BANK_ACCOUNT, PayoutMethodType.PAYPAL, PayoutMethodType.OTHER];

/** Adapts the Expense form "New payout method" option to a standalone form for the given account */
function NewPayoutMethodForAccount({ account, onUpdate }) {
  const form = useFormikContext<Pick<ExpenseFormValues, 'newPayoutMethod'>>();
  const { setFieldValue } = form;
  const actions = useExpenseFormActions({
    resync: onUpdate,
    defaultPayoutMethodAccountSlug: account.slug,
    onPayoutMethodSaved: () => setFieldValue('newPayoutMethod', { data: {} }),
  });

  return (
    <NewPayoutMethodOption
      // This form only holds the new payout method, which is all the option reads and writes
      setFieldValue={form.setFieldValue as ExpenseForm['setFieldValue']}
      setFieldTouched={form.setFieldTouched as ExpenseForm['setFieldTouched']}
      validateForm={form.validateForm as ExpenseForm['validateForm']}
      isSubmitting={form.isSubmitting}
      newPayoutMethod={form.values.newPayoutMethod}
      newPayoutMethodTypes={NEW_PAYOUT_METHOD_TYPES}
      loggedInAccount={account}
      payeeSlug={account.slug}
      payee={account}
      actions={actions}
      isPaypalConnectEnabled
    />
  );
}

export default function CreatePayoutMethodModal({ account, open, onOpenChange, onUpdate }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2">
        <DialogHeader>
          <DialogTitle className="text-xl">
            <FormattedMessage defaultMessage="Add a new payout method" id="vuU49U" />
          </DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{ newPayoutMethod: { data: {} } }}
          onSubmit={noop}
          validate={v => ({ newPayoutMethod: validatePayoutMethod(v.newPayoutMethod) })}
        >
          <NewPayoutMethodForAccount account={account} onUpdate={onUpdate} />
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
