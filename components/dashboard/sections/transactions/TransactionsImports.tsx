import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form, Formik, useFormik } from 'formik';
import { last, sample, truncate } from 'lodash';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import DateTime from '../../../DateTime';
import { FormikZod } from '../../../FormikZod';
import Link from '../../../Link';
import StyledInput from '../../../StyledInput';
import StyledInputField from '../../../StyledInputField';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledSelect from '../../../StyledSelect';
import StyledSelectCreatable from '../../../StyledSelectCreatable';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import { Pagination } from '../../filters/Pagination';

import { TransactionsImport } from './TransactionsImport';

const newImportFormSchema = z.object({
  source: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['CSV', 'MANUAL']),
});

const TransactionImportFieldsFragment = gql`
  fragment TransactionImportFields on TransactionsImport {
    id
    source
    name
    type
    createdAt
    updatedAt
    account {
      ... on Host {
        id
        transactionsImportsSources
      }
    }
  }
`;

const NewImportDialog = ({ accountSlug, ...props }) => {
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
          ...TransactionImportFields
        }
      }
      ${TransactionImportFieldsFragment}
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
          initialValues={{ source: '', name: '', type: '' }}
          onSubmit={async values => {
            try {
              const { data } = await createImport({ variables: { account: { slug: accountSlug }, ...values } });
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
                      onChange={({ value }) => formik.setFieldValue('source', truncate(value.trim(), { length: 200 }))}
                      fontSize="14px"
                      disabled={formik.isSubmitting}
                      placeholder="Select or type a source"
                      loading={loading}
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
                      onChange={({ value }) => formik.setFieldValue('type', value)}
                      fontSize="14px"
                      disabled={formik.isSubmitting}
                      placeholder="Select a type"
                      value={!formik.values.type ? null : { label: formik.values.type, value: formik.values.type }}
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
                  <FormattedMessage defaultMessage="Cancel" id="47FYwb" />
                </Button>
                <Button type="submit" loading={formik.isSubmitting}>
                  <FormattedMessage defaultMessage="Create" id="Rw1Y1q" />
                </Button>
              </div>
            </Form>
          )}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
};

const NB_IMPORTS_DISPLAYED = 20;

const schema = z.object({
  limit: integer.default(NB_IMPORTS_DISPLAYED),
  offset: integer.default(0),
});

const TransactionsImports = ({ accountSlug }) => {
  const [hasNewImportDialog, setHasNewImportDialog] = React.useState(false);
  const router = useRouter();
  const queryFilter = useQueryFilter({ schema, filters: {} });
  const { data, loading, error } = useQuery(
    gql`
      query HostTransactionImports($accountSlug: String!, $limit: Int, $offset: Int) {
        host(slug: $accountSlug) {
          id
          transactionsImports(limit: $limit, offset: $offset) {
            totalCount
            limit
            offset
            nodes {
              id
              ...TransactionImportFields
            }
          }
        }
      }
      ${TransactionImportFieldsFragment}
    `,
    {
      context: API_V2_CONTEXT,
      variables: { accountSlug, ...queryFilter.variables },
    },
  );

  return (
    <div>
      <DashboardHeader
        title="Transactions"
        titleRoute={`/dashboard/${accountSlug}/host-transactions`}
        subpathTitle="Imports"
        actions={
          <Button size="sm" variant="outline" onClick={() => setHasNewImportDialog(true)}>
            <FormattedMessage defaultMessage="New import" id="tMqgaI" />
          </Button>
        }
      />
      <div className="mt-5">
        <DataTable
          loading={loading}
          data={data?.host?.transactionsImports?.nodes}
          onClickRow={({ id }) => router.push(`/dashboard/${accountSlug}/host-transactions/import/${id}?step=last`)}
          columns={[
            {
              header: 'Creation Date',
              accessorKey: 'createdAt',
              cell: ({ cell }) => <DateTime value={cell.getValue()} />,
            },
            {
              header: 'Source',
              accessorKey: 'source',
            },
            {
              header: 'Type',
              accessorKey: 'type',
            },
            {
              header: 'Name',
              accessorKey: 'name',
            },
            {
              header: 'Processed',
              cell: ({ cell }) => {
                const processed = sample(['100%', '40%', '0%']);
                return <Badge type={processed === '100%' ? 'success' : 'warning'}>{processed}</Badge>;
              },
            },
            {
              header: 'Summary',
              cell: ({ cell }) => {
                return `Imported 12 transactions, dismissed 3, 9 remaining`;
              },
            },
          ]}
        />
      </div>
      <Pagination queryFilter={queryFilter} total={data?.host?.transactionsImports?.totalCount} />
      <NewImportDialog accountSlug={accountSlug} onOpenChange={setHasNewImportDialog} open={hasNewImportDialog} />
    </div>
  );
};

export const ImportTransactions = ({ accountSlug, subpath }) => {
  const importId = subpath[1];
  if (importId) {
    return <TransactionsImport accountSlug={accountSlug} importId={importId} />;
  } else {
    return <TransactionsImports accountSlug={accountSlug} />;
  }
};
