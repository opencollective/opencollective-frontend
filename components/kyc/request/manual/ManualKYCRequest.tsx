import React from 'react';
import { FormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { ArrowLeft, Shield } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import { DocumentationCardList } from '@/components/documentation/DocumentationCardList';
import { FormField } from '@/components/FormField';
import { useFormikZod } from '@/components/FormikZod';
import { Button } from '@/components/ui/Button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';

import { ManualKYCRequestConfirmation } from './ManualKYCRequestConfirmation';

export const ManualKYCRequestFormSchema = z.object({
  legalName: z.string().min(1),
  legalAddress: z.string().optional(),
  notes: z.string().optional(),
});

type ManualKYCRequestProps = {
  onBack: () => void;
  onNext: () => void;
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  refetchQueries?: string[];
  backLabel: React.ReactNode;
};

enum Steps {
  FORM = 'FORM',
  CONFIRMATION = 'CONFIRMATION',
}

export function ManualKYCRequest(props: ManualKYCRequestProps) {
  const [step, setStep] = React.useState<Steps>(Steps.FORM);
  const [request, setRequest] = React.useState({});

  return (
    <React.Fragment>
      {step === Steps.FORM && (
        <ManualKYCRequestForm
          backLabel={props.backLabel}
          initialValues={request}
          onBack={props.onBack}
          onNext={r => {
            setStep(Steps.CONFIRMATION);
            setRequest(r);
          }}
        />
      )}

      {step === Steps.CONFIRMATION && (
        <ManualKYCRequestConfirmation
          requestedByAccount={props.requestedByAccount}
          verifyAccount={props.verifyAccount}
          onNext={props.onNext}
          onBack={() => setStep(Steps.FORM)}
          request={request}
          refetchQueries={props.refetchQueries}
        />
      )}
    </React.Fragment>
  );
}

type ManualKYCRequestFormProps = {
  onBack: () => void;
  onNext: (request: z.infer<typeof ManualKYCRequestFormSchema>) => void;
  initialValues: z.infer<typeof ManualKYCRequestFormSchema>;
  backLabel: React.ReactNode;
};

function ManualKYCRequestForm(props: ManualKYCRequestFormProps) {
  const form = useFormikZod({
    schema: ManualKYCRequestFormSchema,
    initialValues: {
      legalName: props.initialValues.legalName ?? '',
      legalAddress: props.initialValues.legalAddress ?? '',
      notes: props.initialValues.notes ?? '',
    },
    async onSubmit(values) {
      const errors = await form.validateForm();
      if (isEmpty(errors)) {
        props.onNext(values);
      }
    },
  });

  const intl = useIntl();

  return (
    <FormikContext value={form}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <FormattedMessage defaultMessage="Manual Verification" id="mynsLw" />
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormField
            name="legalName"
            label={intl.formatMessage({ defaultMessage: 'Legal name', id: 'OozR1Y' })}
            hint={intl.formatMessage({
              defaultMessage: 'The legal name of the account holder',
              id: '3E6g6v',
            })}
            required
            isPrivate
            privateMessage={'Will only be visible to host and user'}
          />
          <FormField
            name="legalAddress"
            label={intl.formatMessage({ defaultMessage: 'Legal address', id: 'kje5uE' })}
            hint={intl.formatMessage({
              defaultMessage: 'The legal address of the account holder',
              id: 'O9zUS8',
            })}
            isPrivate
            required={false}
            privateMessage={'Will only be visible to host and user'}
          />
          <FormField
            name="notes"
            type="textarea"
            label={intl.formatMessage({ id: 'expense.notes', defaultMessage: 'Notes' })}
            hint={intl.formatMessage({
              defaultMessage: 'Additional notes about the verification',
              id: 'pSd3BY',
            })}
            isPrivate
            privateMessage={'Will only be visible to host'}
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
        </form>
      </div>
      <div>
        <DocumentationCardList
          className="mt-auto"
          docs={[
            {
              href: 'https://documentation.opencollective.com/fiscal-hosts/know-your-customer-kyc/manual-kyc',
              title: 'Manual KYC Verification',
              excerpt:
                'Manual KYC verification is a process that allows you to verify the identity and legal information of an account holder manually. This is useful when the automatic verification process fails or when you need to verify the information manually.',
            },
          ]}
        />
      </div>
      <DialogFooter>
        {props.onBack && (
          <Button variant="outline" onClick={props.onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {props.backLabel}
          </Button>
        )}
        <Button onClick={() => form.submitForm()}>
          <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
        </Button>
      </DialogFooter>
    </FormikContext>
  );
}
