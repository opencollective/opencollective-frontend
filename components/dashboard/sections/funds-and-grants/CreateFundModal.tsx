import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { DialogClose, DialogDescription } from '@radix-ui/react-dialog';
import { Form, FormikProvider } from 'formik';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type {
  CreateFundModalQuery,
  CreateFundModalQueryVariables,
  CreateHostedFundMutation,
  CreateHostedFundMutationVariables,
} from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { FormField } from '@/components/FormField';
import { useFormikZod } from '@/components/FormikZod';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { InputGroup } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/useToast';

const createFundModalSchema = z.object({
  fundName: z.string(),
  fundSlug: z.string(),
  fundDescription: z.string(),
});

export function CreateFundModal(props: { open: boolean; setOpen: (open: boolean) => void; hostSlug: string }) {
  const router = useRouter();
  const { refetchLoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const dialogQuery = useQuery<CreateFundModalQuery, CreateFundModalQueryVariables>(
    gql`
      query CreateFundModal($hostSlug: String!) {
        host: account(slug: $hostSlug) {
          id
          legacyId
          name
          currency
        }
      }
    `,
    {
      variables: {
        hostSlug: props.hostSlug,
      },
    },
  );

  const [createFundMutation] = useMutation<CreateHostedFundMutation, CreateHostedFundMutationVariables>(
    gql`
      mutation CreateHostedFund($fund: FundCreateInput!, $hostSlug: String!) {
        createFund(fund: $fund, host: { slug: $hostSlug }) {
          id
          name
          slug
          tags
          description
        }
      }
    `,
    {
      variables: {
        hostSlug: props.hostSlug,
        fund: {
          description: '',
          name: '',
          slug: '',
        },
      },
    },
  );

  const { setOpen } = props;
  const onSubmit = React.useCallback(
    async (values: z.infer<typeof createFundModalSchema>) => {
      try {
        const result = await createFundMutation({
          variables: {
            fund: {
              name: values.fundName,
              slug: values.fundSlug,
              description: values.fundDescription,
            },
            hostSlug: props.hostSlug,
          },
        });
        toast({
          variant: 'success',
          message: intl.formatMessage({ defaultMessage: 'Fund created', id: 'A/2E7y' }),
        });
        setOpen(false);
        await refetchLoggedInUser();
        router.push(`/dashboard/${result.data.createFund.slug}`);
      } catch (err) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, err),
        });
      }
    },
    [createFundMutation, props.hostSlug, intl, setOpen, refetchLoggedInUser, router],
  );

  const loaded = !!dialogQuery.data;
  const host = dialogQuery.data?.host;

  const formik = useFormikZod({
    schema: createFundModalSchema,
    initialValues: {
      fundName: '',
      fundSlug: '',
      fundDescription: '',
    },
    onSubmit,
  });

  const { setFieldValue, resetForm } = formik;
  React.useEffect(() => {
    if (!formik.touched.fundSlug) {
      const suggestion = suggestSlug(formik.values.fundName);
      setFieldValue('fundSlug', suggestion);
    }
  }, [formik.values.fundName, formik.touched.fundSlug, setFieldValue]);

  React.useEffect(() => {
    resetForm();
  }, [props.open, resetForm]);

  const submitEnabled = loaded && !formik.isSubmitting;

  return (
    <FormikProvider value={formik}>
      <Dialog open={props.open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              <FormattedMessage defaultMessage="Create fund" id="0frjVr" />
            </DialogTitle>
            {loaded ? (
              <DialogDescription>
                <FormattedMessage defaultMessage="Hosted by {host}" id="Idxnnc" values={{ host: host?.name }} />
              </DialogDescription>
            ) : (
              <Skeleton />
            )}
          </DialogHeader>

          <Form className="flex flex-col items-start gap-4">
            <FormField required name="fundName" label={<FormattedMessage defaultMessage="Fund name" id="nPLfxb" />} />
            <FormField
              required
              name="fundDescription"
              label={<FormattedMessage defaultMessage="Fund description" id="fDI7CQ" />}
            />
            <FormField required name="fundSlug" label={<FormattedMessage defaultMessage="Profile URL" id="+1HAHt" />}>
              {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" type="text" {...field} />}
            </FormField>

            <DialogFooter className="w-full">
              <DialogClose asChild>
                <Button variant="outline">
                  <FormattedMessage id="Close" defaultMessage="Close" />
                </Button>
              </DialogClose>
              <Button type="submit" loading={formik.isSubmitting} disabled={!submitEnabled}>
                <FormattedMessage id="submit" defaultMessage="Submit" />
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </FormikProvider>
  );
}
