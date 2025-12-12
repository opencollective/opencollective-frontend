import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { getAccountReferenceInput } from '@/lib/collective';
import type { Account } from '@/lib/graphql/types/v2/graphql';

import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useToast } from '../ui/useToast';

const convertOrganizationToCollectiveMutation = gql`
  mutation ConvertOrganizationToCollective($organization: AccountReferenceInput!) {
    convertOrganizationToCollective(organization: $organization) {
      id
      type
      slug
    }
  }
`;

type ConvertToCollectiveModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  collective: Pick<Account, 'id' | 'slug' | 'name'>;
};

export function ConvertToCollectiveModal({ open, setOpen, collective }: ConvertToCollectiveModalProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const router = useRouter();
  const [convertToCollective, { loading: isConverting }] = useMutation(convertOrganizationToCollectiveMutation);

  const handleConvert = React.useCallback(async () => {
    try {
      await convertToCollective({
        variables: {
          organization: getAccountReferenceInput(collective),
        },
      });

      toast({
        variant: 'success',
        message: (
          <FormattedMessage defaultMessage="Successfully converted to Collective" id="convertToCollective.success" />
        ),
      });

      try {
        await router.push(`/dashboard/${collective.slug}/overview`);
      } catch {
        // Ignore errors
      }
    } catch (error) {
      toast({
        variant: 'error',
        title: <FormattedMessage defaultMessage="Conversion failed" id="convertToCollective.error.title" />,
        message: i18nGraphqlException(intl, error),
      });
    }
  }, [convertToCollective, intl, toast, collective, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">
            <FormattedMessage defaultMessage="Convert to Collective" id="convertToCollective.button" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage
              defaultMessage="Convert {name} to a Collective. This will prevent you from using money management and fiscal hosting capabilities, and you will have to apply to a Fiscal Host."
              id="convertToCollective.description"
              values={{ name: <span className="font-medium italic">{collective.name}</span> }}
            />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="w-full">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConvert} loading={isConverting} disabled={isConverting}>
            <FormattedMessage defaultMessage="Convert to Collective" id="convertToCollective.button" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
