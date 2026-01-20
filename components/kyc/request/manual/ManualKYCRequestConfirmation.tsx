import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { ArrowLeft, FileText as FileTextIcon, Info, MapPin, Shield, User } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import type z from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import { Button } from '@/components/ui/Button';
import { DataList, DataListItem } from '@/components/ui/DataList';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/useToast';

import { kycVerificationFields } from '../../graphql';
import { KYCRequestAccountCard } from '../KYCRequestAccountCard';

import type { ManualKYCRequestFormSchema } from './ManualKYCRequest';

type ManualKYCRequestConfirmationProps = {
  onBack: () => void;
  onNext: () => void;
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  request: z.infer<typeof ManualKYCRequestFormSchema>;
  refetchQueries?: string[];
};

export function ManualKYCRequestConfirmation(props: ManualKYCRequestConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitVerification] = useMutation(
    gql`
      mutation RequestManualKYCVerification(
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
        verifyAccount: props.verifyAccount,
        request: { manual: props.request },
      },
    },
  );

  const intl = useIntl();
  const { toast } = useToast();

  const { onNext } = props;
  const onSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    try {
      await submitVerification();
      toast({
        variant: 'success',
        message: intl.formatMessage({
          defaultMessage: 'KYC verification request submitted successfully',
          id: 'IfFsjj',
        }),
      });
      onNext();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      setIsSubmitting(false);
    }
  }, [intl, onNext, submitVerification, toast]);

  return (
    <React.Fragment>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <FormattedMessage defaultMessage="Confirm KYC Information" id="C7KYiC" />
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {props.verifyAccount && <KYCRequestAccountCard account={props.verifyAccount} />}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            <FormattedMessage
              defaultMessage="Please review the verification details below before submitting. Once submitted, this KYC verification will be created and the account holder will be notified."
              id="o2wzoj"
            />
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              <FormattedMessage defaultMessage="KYC Information" id="2Un6+c" />
            </h3>
            <DataList>
              <DataListItem
                label={
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <FormattedMessage id="LegalName" defaultMessage="Legal Name" />
                  </div>
                }
                labelClassName="min-w-auto sm:!basis-[180px]"
                itemClassName="font-medium whitespace-pre-line text-slate-900 grow overflow-hidden"
                value={props.request.legalName}
              />

              {props.request.legalAddress && (
                <DataListItem
                  label={
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <FormattedMessage id="LegalAddress" defaultMessage="Legal Address" />
                    </div>
                  }
                  labelClassName="min-w-auto sm:!basis-[180px]"
                  itemClassName="font-medium whitespace-pre-line text-slate-900 grow overflow-hidden"
                  value={props.request.legalAddress}
                />
              )}

              {props.request.notes && (
                <DataListItem
                  label={
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-slate-500" />
                      <FormattedMessage defaultMessage="Additional Notes" id="PzWdQF" />
                    </div>
                  }
                  labelClassName="min-w-auto sm:!basis-[180px]"
                  itemClassName="whitespace-pre-line text-slate-700 grow overflow-hidden"
                  value={props.request.notes}
                />
              )}
            </DataList>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-blue-900">
                <FormattedMessage defaultMessage="Privacy & Security" id="asd4Px" />
              </p>
              <p className="text-xs text-blue-800">
                <FormattedMessage
                  defaultMessage="Legal name and address are only visible to the account holder and authorized team members. Notes are only visible to authorized team members."
                  id="H1uH4P"
                />
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={props.onBack} disabled={isSubmitting} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <FormattedMessage id="Back" defaultMessage="Back" />
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} loading={isSubmitting}>
          <FormattedMessage defaultMessage="Submit KYC Information" id="77Fwq2" />
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
}
