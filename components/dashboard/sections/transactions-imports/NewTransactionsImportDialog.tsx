import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form } from 'formik';
import { truncate } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { TransactionImportListFieldsFragment } from './lib/graphql';

import { FormikZod } from '../../../FormikZod';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledSelect from '../../../StyledSelect';
import StyledSelectCreatable from '../../../StyledSelectCreatable';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';

const newImportFormSchema = z.object({
  source: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['CSV', 'MANUAL']),
});

export const NewTransactionsImportDialog = ({ accountSlug, onSuccess, ...props }) => {
  const router = useRouter();
  const { toast } = useToast();
  const intl = useIntl();
  const { data, loading } = useQuery(
    gql`
      query HostTransactionsImportsSources($accountSlug: String!) {
        host(slug: $accountSlug) {
          id
          transactionsImportsSources
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: { accountSlug },
    },
  );

  const [createImport] = useMutation(
    gql`
      mutation CreateTransactionsImport(
        $account: AccountReferenceInput!
        $type: TransactionsImportType!
        $source: NonEmptyString!
        $name: NonEmptyString!
      ) {
        createTransactionsImport(account: $account, source: $source, name: $name, type: $type) {
          id
          account {
            id
            ... on Host {
              id
              transactionsImportsSources
            }
            ... on Organization {
              host {
                id
                transactionsImportsSources
              }
            }
          }
          ...TransactionImportListFields
        }
      }
      ${TransactionImportListFieldsFragment}
    `,
    { context: API_V2_CONTEXT },
  );

  const existingSources = data?.host?.transactionsImportsSources || [];
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="New Transactions Import" id="4jJjCO" />
          </DialogTitle>
        </DialogHeader>
        <FormikZod
          schema={newImportFormSchema}
          initialValues={{ source: '', name: '', type: 'CSV' }}
          onSubmit={async values => {
            try {
              const { data } = await createImport({ variables: { account: { slug: accountSlug }, ...values } });
              onSuccess?.();
              props.onOpenChange(false);
              router.push(`/dashboard/${accountSlug}/host-transactions/import/${data.createTransactionsImport.id}`);
            } catch (e) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          {formik => (
            <Form>
              <div className="flex flex-col gap-3">
                <StyledInputFormikField name="source" required label="Source">
                  {({ field }) => (
                    <StyledSelectCreatable
                      inputId={field.id}
                      error={field.error}
                      onChange={option =>
                        formik.setFieldValue('source', truncate(option?.value?.trim(), { length: 200 }))
                      }
                      fontSize="14px"
                      disabled={formik.isSubmitting}
                      placeholder="Select or type a source"
                      isLoading={loading}
                      options={existingSources.map(source => ({ label: source, value: source })) || []}
                      value={
                        !formik.values.source ? null : { label: formik.values.source, value: formik.values.source }
                      }
                    />
                  )}
                </StyledInputFormikField>
                <StyledInputFormikField name="type" required label="Type">
                  {({ field }) => (
                    <StyledSelect
                      inputId={field.id}
                      error={field.error}
                      onChange={option => formik.setFieldValue('type', option?.['value'])}
                      fontSize="14px"
                      disabled={formik.isSubmitting}
                      placeholder="Select a type"
                      value={!formik.values.type ? null : { label: formik.values.type, value: formik.values.type }}
                      isDisabled
                      options={[
                        { label: 'CSV', value: 'CSV' },
                        { label: 'Manual', value: 'MANUAL' },
                      ]}
                    />
                  )}
                </StyledInputFormikField>
                <StyledInputFormikField
                  name="name"
                  required
                  label="Import Name"
                  placeholder="e.g. Pending contributions for June 2024"
                  disabled={formik.isSubmitting}
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => props.onOpenChange(false)}>
                  <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                </Button>
                <Button type="submit" loading={formik.isSubmitting}>
                  <FormattedMessage defaultMessage="Create" id="create" />
                </Button>
              </div>
            </Form>
          )}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
};
