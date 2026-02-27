import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormikProvider } from 'formik';
import { ArrowLeft, Download } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import { FormField } from '@/components/FormField';
import { useFormikZod } from '@/components/FormikZod';
import { Button } from '@/components/ui/Button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/useToast';

import { kycVerificationFields } from '../../graphql';
import { KYCRequestAccountCard } from '../KYCRequestAccountCard';

const personaImportInquiryFormSchema = z.object({
  inquiryId: z.string().min(1),
});

type PersonaImportInquiryProps = {
  onBack: () => void;
  onNext: () => void;
  refetchQueries?: string[];
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  backLabel: React.ReactNode;
};
export function PersonaImportInquiry(props: PersonaImportInquiryProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [importPersonaInquiry] = useMutation(
    gql`
      mutation ImportPersonaInquiry(
        $requestedByAccount: AccountReferenceInput!
        $verifyAccount: AccountReferenceInput!
        $inquiryId: String!
      ) {
        requestKYCVerification(
          requestedByAccount: $requestedByAccount
          verifyAccount: $verifyAccount
          provider: PERSONA
          request: { persona: { importInquiryId: $inquiryId } }
        ) {
          ...KYCVerificationFields
        }
      }
      ${kycVerificationFields}
    `,
    {
      refetchQueries: props.refetchQueries,
    },
  );

  const { onNext } = props;

  const form = useFormikZod({
    schema: personaImportInquiryFormSchema,
    initialValues: {
      inquiryId: '',
    },
    async onSubmit(values) {
      try {
        await importPersonaInquiry({
          variables: {
            requestedByAccount: getAccountReferenceInput(props.requestedByAccount),
            verifyAccount: getAccountReferenceInput(props.verifyAccount),
            inquiryId: values.inquiryId,
          },
        });
        toast({
          variant: 'success',
          message: intl.formatMessage({
            defaultMessage: 'Persona inquiry imported successfully',
            id: 'FOBhPQ',
          }),
        });
        onNext();
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      }
    },
  });

  return (
    <FormikProvider value={form}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-purple-600" />
          <FormattedMessage defaultMessage="Import Persona Inquiry" id="7I2m2l" />
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={form.handleSubmit} className="space-y-6 py-4">
        {props.verifyAccount && <KYCRequestAccountCard account={props.verifyAccount} />}

        <p className="text-sm text-slate-600">
          <FormattedMessage
            defaultMessage="Enter the Persona inquiry ID from your Persona dashboard. You can find this in the inquiry details page in your Persona account."
            id="GOfyNq"
          />
        </p>

        <FormField
          name="inquiryId"
          label={<FormattedMessage defaultMessage="Persona Inquiry ID" id="eJeEgt" />}
          hint={
            <FormattedMessage
              defaultMessage="The inquiry ID can be found in your Persona dashboard under the inquiry details page"
              id="FBjmRh"
            />
          }
          placeholder="inq_xxxxxxxxxxxxx"
          required
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={props.onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {props.backLabel}
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            <FormattedMessage id="submit" defaultMessage="Submit" />
          </Button>
        </DialogFooter>
      </form>
    </FormikProvider>
  );
}
