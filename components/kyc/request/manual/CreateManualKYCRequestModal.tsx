import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { Shield } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/graphql';

import { FormField } from '@/components/FormField';
import { useFormikZod } from '@/components/FormikZod';
import type { BaseModalProps } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/useToast';

import { kycVerificationFields } from '../../graphql';
import { KYCRequestAccountCard } from '../KYCRequestAccountCard';

type CreateManualKYCRequestModalProps = {
  verifyAccount: AccountReferenceInput;
  requestedByAccount: AccountReferenceInput;
  refetchQueries?: string[];
} & BaseModalProps;

const CreateManualKYCRequestFormSchema = z.object({
  notes: z.string().optional(),
});

export function CreateManualKYCRequestModal(props: CreateManualKYCRequestModalProps) {
  const intl = useIntl();

  const [createVerificationRequest] = useMutation(
    gql`
      mutation CreateManualKYCVerificationRequest(
        $requestedByAccount: AccountReferenceInput!
        $verifyAccount: AccountReferenceInput!
        $request: RequestKYCVerificationInput!
      ) {
        requestKYCVerification(
          requestedByAccount: $requestedByAccount
          verifyAccount: $verifyAccount
          request: $request
          provider: MANUAL
        ) {
          ...KYCVerificationFields
        }
      }
      ${kycVerificationFields}
    `,
    {
      refetchQueries: props.refetchQueries,
      variables: {
        requestedByAccount: getAccountReferenceInput(props.requestedByAccount),
        verifyAccount: getAccountReferenceInput(props.verifyAccount),
      },
    },
  );

  const form = useFormikZod({
    schema: CreateManualKYCRequestFormSchema,
    initialValues: {
      notes: '',
    },
    async onSubmit(values) {
      const errors = await form.validateForm();
      if (isEmpty(errors)) {
        try {
          await createVerificationRequest({
            variables: {
              request: {
                manual: {
                  notes: values.notes,
                },
              },
            },
          });
          props.setOpen(false);
          toast({
            variant: 'success',
            message: intl.formatMessage({
              defaultMessage: 'KYC verification request created successfully',
              id: 'KuT0mH',
            }),
          });
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
        }
      }
    },
  });

  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent>
        <FormikContext value={form}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <FormattedMessage defaultMessage="Request KYC" id="+mK0ZG" />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {props.verifyAccount && <KYCRequestAccountCard account={props.verifyAccount} />}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <FormattedMessage
                  defaultMessage="This will create a pending manual KYC verification from this account holder."
                  id="tGx5HV"
                />
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                name="notes"
                type="textarea"
                label={intl.formatMessage({ id: 'expense.notes', defaultMessage: 'Notes' })}
                hint={intl.formatMessage({
                  defaultMessage: 'Additional notes about the verification. Only visible to host.',
                  id: 'S5oKoe',
                })}
                isPrivate
                required={false}
                privateMessage={intl.formatMessage({ defaultMessage: 'Will only be visible to host', id: 'EsUkFj' })}
              >
                {({ field, meta }) => (
                  <Textarea
                    {...field}
                    placeholder=""
                    maxLength={500}
                    showCount
                    error={meta.error && meta.touched}
                    rows={4}
                    className="min-h-[100px]"
                  />
                )}
              </FormField>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => props.setOpen(false)}
              disabled={form.isSubmitting}
              loading={form.isSubmitting}
            >
              <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
            </Button>
            <Button onClick={() => form.handleSubmit()} disabled={form.isSubmitting} loading={form.isSubmitting}>
              <FormattedMessage defaultMessage="Create Request" id="19WcRb" />
            </Button>
          </DialogFooter>
        </FormikContext>
      </DialogContent>
    </Dialog>
  );
}
