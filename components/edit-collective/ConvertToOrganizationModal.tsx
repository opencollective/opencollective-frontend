import React from 'react';
import { useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { Form, FormikProvider } from 'formik';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../lib/errors';
import { gql } from '../../lib/graphql/helpers';
import { getAccountReferenceInput } from '@/lib/collective';
import type { Account } from '@/lib/graphql/types/v2/graphql';

import { FormField } from '../FormField';
import { useFormikZod } from '../FormikZod';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { useToast } from '../ui/useToast';

const convertToOrganizationSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required'),
});

const convertAccountToOrganizationMutation = gql`
  mutation ConvertAccountToOrganization(
    $account: AccountReferenceInput!
    $hasMoneyManagement: Boolean
    $legalName: String
  ) {
    convertAccountToOrganization(account: $account, hasMoneyManagement: $hasMoneyManagement, legalName: $legalName) {
      id
      type
      slug
      legalName
    }
  }
`;

type ConvertToOrganizationModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  collective: Pick<Account, 'id' | 'legalName' | 'slug' | 'name'>;
};

export function ConvertToOrganizationModal({ open, setOpen, collective }: ConvertToOrganizationModalProps) {
  const router = useRouter();
  const intl = useIntl();
  const { toast } = useToast();

  const [convertToOrganization, { loading: isConverting }] = useMutation(convertAccountToOrganizationMutation);

  const onSubmit = React.useCallback(
    async (values: z.infer<typeof convertToOrganizationSchema>) => {
      try {
        await convertToOrganization({
          variables: {
            account: getAccountReferenceInput(collective),
            hasMoneyManagement: true,
            legalName: values.legalName,
          },
        });

        try {
          await router.push(`/dashboard/${collective.slug}/overview`);
        } catch {
          // Ignore errors
        }

        toast({
          variant: 'success',
          message: (
            <FormattedMessage defaultMessage="Successfully converted to Organization" id="convertToOrg.success" />
          ),
        });
      } catch (error) {
        toast({
          variant: 'error',
          title: <FormattedMessage defaultMessage="Conversion failed" id="convertToOrg.error.title" />,
          message: i18nGraphqlException(intl, error),
        });
      }
    },
    [convertToOrganization, intl, router, toast, collective],
  );

  const formik = useFormikZod({
    schema: convertToOrganizationSchema,
    initialValues: {
      legalName: collective.legalName || '',
    },
    onSubmit,
    validateOnMount: false,
  });

  React.useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open, formik]);

  return (
    <FormikProvider value={formik}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              <FormattedMessage defaultMessage="Convert to Organization" id="convertToOrg.button" />
            </DialogTitle>
            <DialogDescription>
              <FormattedMessage
                defaultMessage="Convert {name} to an Organization. This will enable you to manage money and optionally host other Collectives."
                id="pY1QbK"
                values={{ name: <span className="font-medium italic">{collective.name}</span> }}
              />
            </DialogDescription>
          </DialogHeader>

          <Form className="flex flex-col items-start gap-4">
            <FormField
              required
              name="legalName"
              label={<FormattedMessage defaultMessage="Organization legal name" id="tdc8bZ" />}
            >
              {({ field }) => (
                <Input
                  {...field}
                  type="text"
                  maxLength={255}
                  className="w-full"
                  placeholder={intl.formatMessage(
                    { id: 'examples', defaultMessage: 'e.g., {examples}' },
                    { examples: 'Open Collective Inc.' },
                  )}
                />
              )}
            </FormField>

            <DialogFooter className="w-full">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </Button>
              </DialogClose>
              <Button
                type="submit"
                loading={formik.isSubmitting || isConverting}
                disabled={formik.isSubmitting || isConverting}
              >
                <FormattedMessage defaultMessage="Convert to Organization" id="convertToOrg.button" />
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </FormikProvider>
  );
}
