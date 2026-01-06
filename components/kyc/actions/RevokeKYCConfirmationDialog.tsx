import React from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type { KycVerificationActionsFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import type { BaseModalProps } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { toast } from '@/components/ui/useToast';

import { kycVerificationFields } from '../graphql';

type RevokeKYCConfirmationDialogProps = {
  refetchQueries?: string[];
  kycVerification: KycVerificationActionsFieldsFragment;
} & BaseModalProps;
export function RevokeKYCConfirmationDialog(props: RevokeKYCConfirmationDialogProps) {
  const { open, setOpen, refetchQueries, kycVerification } = props;
  const intl = useIntl();
  const [revokeKYCVerification] = useMutation(
    gql`
      mutation RevokeKYCVerification($kycVerification: KYCVerificationReferenceInput!) {
        revokeKYCVerification(kycVerification: $kycVerification) {
          ...KYCVerificationFields
        }
      }
      ${kycVerificationFields}
    `,
    {
      refetchQueries,
      variables: {
        kycVerification: kycVerification.id,
      },
    },
  );

  const onConfirm = React.useCallback(async () => {
    try {
      await revokeKYCVerification();
      setOpen(false);
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'KYC revoked successfully', id: 'qwtDgh' }),
      });
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    }
  }, [revokeKYCVerification, setOpen, intl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Are you sure you want to revoke this KYC Verification?" id="ULhK9y" />
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <FormattedMessage
            defaultMessage="This action will remove this individual's current verification status. They will need to undergo the verification process again if verification is required."
            id="pH0tKW"
          />
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <FormattedMessage defaultMessage="Revoke KYC" id="QdeomH" />{' '}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
