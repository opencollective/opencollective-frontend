import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import useProcessExpense from '../../lib/expenses/useProcessExpense';
import type { Expense } from '../../lib/graphql/types/v2/graphql';

import { useFormikZod } from '../FormikZod';
import ConfirmationModal from '../NewConfirmationModal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

type DeclineExpenseInviteButtonProps = {
  expense: Pick<Expense, 'legacyId' | 'id'>;
  draftKey?: string;
};

const schema = z.object({
  declineReason: z.string().min(3).max(255),
});

export default function DeclineExpenseInviteButton(props: DeclineExpenseInviteButtonProps) {
  const intl = useIntl();
  const [isDeclineModalOpen, setIsDeclineModalOpen] = React.useState(false);
  const { declineInvitation } = useProcessExpense({ expense: props.expense });

  const formik = useFormikZod({
    initialValues: {
      declineReason: '',
    },
    onSubmit(values) {
      return declineInvitation({ message: values.declineReason, draftKey: props.draftKey });
    },
    schema,
  });

  const resetForm = formik.resetForm;
  React.useEffect(() => {
    resetForm();
  }, [isDeclineModalOpen, resetForm]);

  const { setFieldTouched, submitForm, validateForm } = formik;
  const onConfirm = React.useCallback(async () => {
    const errors = await validateForm();
    setFieldTouched('declineReason');
    if (errors.declineReason) {
      throw new Error(errors.declineReason);
    }
    await submitForm();
  }, [submitForm, validateForm, setFieldTouched]);

  return (
    <React.Fragment>
      <Button variant="destructive" onClick={() => setIsDeclineModalOpen(true)}>
        <FormattedMessage defaultMessage="Decline expense invite" id="BEVVH+" />
      </Button>
      <ConfirmationModal
        title={<FormattedMessage defaultMessage="Confirm declining this expense invitation" id="syX03a" />}
        onConfirm={onConfirm}
        open={isDeclineModalOpen}
        setOpen={setIsDeclineModalOpen}
      >
        <div className="text-base text-foreground">
          <Textarea
            placeholder={intl.formatMessage({
              defaultMessage: 'Please provide a reason for declining this expense invitation',
              id: '3sYEu2',
            })}
            {...formik.getFieldProps('declineReason')}
          />
          <div className="ml-1 mt-1 h-4 text-xs text-red-500">
            {formik.errors.declineReason && formik.touched.declineReason ? formik.errors.declineReason : ''}
          </div>
        </div>
      </ConfirmationModal>
    </React.Fragment>
  );
}
