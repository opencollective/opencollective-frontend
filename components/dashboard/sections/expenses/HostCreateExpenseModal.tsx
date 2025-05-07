import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form } from 'formik';
import { groupBy, map, omit, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '../../../../lib/collective';
import { i18nGraphqlException } from '../../../../lib/errors';
import { standardizeExpenseItemIncurredAt } from '../../../../lib/expenses';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  Account,
  Host,
  TransactionsImport,
  TransactionsImportRow,
  TransactionsImportStats,
} from '../../../../lib/graphql/types/v2/schema';
import { Currency, ExpenseType } from '../../../../lib/graphql/types/v2/schema';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { isValidUrl } from '../../../../lib/utils';
import { attachmentDropzoneParams } from '../../../expenses/lib/attachments';
import type { AccountingCategory } from '@/lib/graphql/types/v2/graphql';
import type { PossiblyArray } from '@/lib/types';

import AccountingCategorySelect from '@/components/AccountingCategorySelect';

import CollectivePicker, { DefaultCollectiveLabel } from '../../../CollectivePicker';
import CollectivePickerAsync from '../../../CollectivePickerAsync';
import Dropzone from '../../../Dropzone';
import { ExchangeRate } from '../../../ExchangeRate';
import { FormikZod } from '../../../FormikZod';
import type { BaseModalProps } from '../../../ModalContext';
import { StyledInputAmountWithDynamicFxRate } from '../../../StyledInputAmountWithDynamicFxRate';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledSelect from '../../../StyledSelect';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogHeader } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';
import { TransactionsImportRowDetailsAccordion } from '../transactions-imports/TransactionsImportRowDetailsAccordion';

const hostCreateExpenseModalPayeeSelectQuery = gql`
  query HostCreateExpenseModalPayeeSelect($hostId: String!, $forAccount: AccountReferenceInput) {
    host(id: $hostId) {
      id
      slug
      name
      type
      description
      isHost
      imageUrl(height: 64)
      vendors(forAccount: $forAccount) {
        nodes {
          id
          slug
          name
          type
          description
          imageUrl(height: 64)
        }
      }
    }
  }
`;

const PayeeSelect = ({
  host,
  forAccount = null,
  ...props
}: {
  host: Pick<Account, 'id' | 'legacyId'>;
  forAccount: Account;
} & React.ComponentProps<typeof CollectivePickerAsync>) => {
  const intl = useIntl();
  const { data, loading } = useQuery(hostCreateExpenseModalPayeeSelectQuery, {
    context: API_V2_CONTEXT,
    variables: { hostId: host.id, forAccount: getAccountReferenceInput(forAccount) },
  });
  const recommendedVendors = data?.host?.vendors?.nodes || [];
  const defaultSources = [...recommendedVendors, host];
  const defaultSourcesOptions = map(groupBy(defaultSources, 'type'), (accounts, type) => {
    return {
      label: formatCollectiveType(intl, type, accounts.length),
      options: accounts.map(account => ({
        value: account,
        label: <DefaultCollectiveLabel value={account} />,
      })),
    };
  });

  return (
    <CollectivePickerAsync
      {...props}
      data-cy="payee-select"
      types={['USER', 'ORGANIZATION', 'VENDOR', 'PROJECT']}
      customOptions={defaultSourcesOptions}
      menuPortalTarget={null}
      includeVendorsForHostId={host.legacyId}
      creatable={['USER', 'VENDOR']}
      HostCollectiveId={host.legacyId}
      isLoading={loading}
    />
  );
};

const hostCreateExpenseMutation = gql`
  mutation HostCreateExpense(
    $expense: ExpenseCreateInput!
    $account: AccountReferenceInput!
    $transactionsImportRow: TransactionsImportRowReferenceInput
  ) {
    createExpense(expense: $expense, account: $account, transactionsImportRow: $transactionsImportRow) {
      id
      legacyId
      account {
        id
        slug
        name
        type
        imageUrl(height: 48)
      }
    }
  }
`;

const SUPPORTED_EXPENSE_TYPES = omit(ExpenseType, [
  ExpenseType.UNCLASSIFIED,
  ExpenseType.CHARGE,
  ExpenseType.SETTLEMENT,
  ExpenseType.FUNDING_REQUEST,
]);

const hostExpenseFormValuesSchema = z
  .object({
    type: z.enum(Object.values(SUPPORTED_EXPENSE_TYPES) as [ExpenseType, ...ExpenseType[]]),
    description: z.string().min(3),
    payee: z.object({}),
    account: z.object({}),
    accountingCategory: z.object({}).optional().nullable(),
    incurredAt: z.string(),
    amount: z.object({ valueInCents: z.number(), currency: z.nativeEnum(Currency) }),
    attachedFile: z.object({ url: z.string() }).optional().nullable(),
  })
  .and(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal(ExpenseType.RECEIPT),
        attachedFile: z.object({ url: z.string() }),
      }),
      z.object({
        type: z.enum(Object.values(omit(SUPPORTED_EXPENSE_TYPES, ExpenseType.RECEIPT)) as [string, ...string[]]),
        attachedFile: z.object({ url: z.string() }).optional().nullable(),
      }),
    ]),
  );

type FormValuesSchema = z.infer<typeof hostExpenseFormValuesSchema>;

const getInitialValues = (importRow: TransactionsImportRow, account): FormValuesSchema => {
  const defaultAccount = !Array.isArray(account) ? account : account.length === 1 ? account[0] : null;
  return {
    type: null,
    description: importRow?.description || '',
    payee: null,
    account: pick(defaultAccount, ['id', 'slug', 'name', 'type', 'imageUrl']),
    accountingCategory: null,
    incurredAt: standardizeExpenseItemIncurredAt(importRow?.date),
    amount: {
      valueInCents: Math.abs(importRow?.amount.valueInCents) || 0,
      currency: importRow?.amount.currency || account?.currency || null,
    },
  };
};

const getExpenseTypeOption = (intl, value) => ({ label: i18nExpenseType(intl, value), value });

export const HostCreateExpenseModal = ({
  setOpen,
  transactionsImport,
  transactionsImportRow,
  host,
  account,
  ...props
}: {
  host: Pick<Host, 'id' | 'slug' | 'type' | 'legacyId' | 'currency'> & {
    accountingCategories?: Pick<Host['accountingCategories'], 'totalCount'> & {
      nodes: Array<Pick<AccountingCategory, 'id' | 'code' | 'name' | 'friendlyName' | 'expensesTypes'>>;
    };
  };
  account?: PossiblyArray<Pick<Account, 'id' | 'slug' | 'name' | 'type'>>;
  transactionsImport?: Pick<TransactionsImport, 'id' | 'source' | 'csvConfig'>;
  transactionsImportRow?: TransactionsImportRow;
} & BaseModalProps) => {
  const intl = useIntl();
  const [createExpense, { client }] = useMutation(hostCreateExpenseMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  const expenseTypeOptions = React.useMemo(
    () => Object.values(SUPPORTED_EXPENSE_TYPES).map(value => getExpenseTypeOption(intl, value)),
    [intl],
  );

  return (
    <Dialog {...props} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-xl font-bold">
            <FormattedMessage defaultMessage="Add expense" id="6/UjBO" />
          </h2>
        </DialogHeader>
        {transactionsImportRow && (
          <TransactionsImportRowDetailsAccordion transactionsImportRow={transactionsImportRow} className="mb-4" />
        )}
        <FormikZod<FormValuesSchema>
          schema={hostExpenseFormValuesSchema}
          initialValues={getInitialValues(transactionsImportRow, account)}
          onSubmit={async values => {
            try {
              const result = await createExpense({
                variables: {
                  account: getAccountReferenceInput(values.account),
                  transactionsImportRow: transactionsImportRow && { id: transactionsImportRow.id },
                  expense: {
                    ...pick(values, ['description', 'type']),
                    accountingCategory: values.accountingCategory && pick(values.accountingCategory, ['id']),
                    payee: getAccountReferenceInput(values.payee),
                    currency: host.currency,
                    payoutMethod: {
                      type: 'OTHER',
                      data: {
                        content: `Transaction import${transactionsImport?.source ? ` from ${transactionsImport.source} (#${transactionsImport.id})` : ''}`,
                        currency: values.amount.currency,
                      },
                    },
                    items: [
                      {
                        amountV2: omit(values.amount, ['exchangeRate.__typename', 'exchangeRate.isApproximate']),
                        description: values.description,
                        incurredAt: standardizeExpenseItemIncurredAt(values.incurredAt),
                        url: values.type === ExpenseType.RECEIPT ? values['attachedFile']?.url : null,
                      },
                    ],
                    attachedFiles:
                      values.type === ExpenseType.RECEIPT || !values['attachedFile']
                        ? []
                        : [pick(values['attachedFile'], ['url'])],
                  },
                },
              });
              toast({
                variant: 'success',
                message: intl.formatMessage({ id: 'Expense.Activity.Created', defaultMessage: 'Expense created' }),
              });

              // Update row in cache
              client.cache.modify({
                id: client.cache.identify(transactionsImportRow),
                fields: { expense: () => result.data.createExpense },
              });

              // Update transactions import stats
              client.cache.modify({
                id: client.cache.identify(host),
                fields: {
                  stats: (stats: TransactionsImportStats): TransactionsImportStats => {
                    return {
                      ...stats,
                      imported: stats.imported + 1,
                      processed: stats.processed + 1,
                      expenses: stats.expenses + 1,
                    };
                  },
                },
              });

              setOpen(false);
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          {({ isSubmitting, setFieldValue, setFieldTouched, values }) => (
            <Form>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <StyledInputFormikField
                    name="description"
                    label={<FormattedMessage defaultMessage="Description" id="Fields.description" />}
                    autoFocus
                  />
                  <StyledInputFormikField
                    inputType="date"
                    name="incurredAt"
                    label={<FormattedMessage defaultMessage="Date" id="expense.incurredAt" />}
                    formatValue={value => value?.split('T')[0]}
                  />
                  <StyledInputFormikField
                    name="amount"
                    label={<FormattedMessage defaultMessage="Amount" id="Fields.amount" />}
                  >
                    {({ field }) => (
                      <React.Fragment>
                        <StyledInputAmountWithDynamicFxRate
                          onChange={valueInCents => setFieldValue('amount', { ...values.amount, valueInCents })}
                          onCurrencyChange={currency => setFieldValue('amount', { ...values.amount, currency })}
                          onExchangeRateChange={exchangeRate =>
                            setFieldValue('amount', { ...values.amount, exchangeRate })
                          }
                          exchangeRate={field.value.exchangeRate}
                          fromCurrency={field.value.currency}
                          toCurrency={host.currency}
                          value={field.value.valueInCents}
                          disabled={field.disabled}
                          date={values.incurredAt}
                        />
                        {Boolean(field.value.exchangeRate && field.value.exchangeRate.value !== 1) && (
                          <ExchangeRate
                            className="mt-2 justify-end text-neutral-600"
                            exchangeRate={field.value.exchangeRate}
                          />
                        )}
                      </React.Fragment>
                    )}
                  </StyledInputFormikField>
                  <StyledInputFormikField
                    name="type"
                    label={<FormattedMessage defaultMessage="Type" id="Expense.type" />}
                  >
                    {({ field }) => (
                      <StyledSelect
                        inputId={field.id}
                        error={field.error}
                        onChange={option => {
                          setFieldValue('attachedFile', null);
                          setFieldValue('type', option?.['value']);
                        }}
                        fontSize="14px"
                        isDisabled={field.disabled}
                        placeholder="Select a type"
                        value={!values.type ? null : getExpenseTypeOption(intl, values.type)}
                        options={expenseTypeOptions}
                        menuPortalTarget={null}
                      />
                    )}
                  </StyledInputFormikField>
                  <StyledInputFormikField
                    name="account"
                    label={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
                  >
                    {({ field }) =>
                      Array.isArray(account) && account.length > 0 ? (
                        <CollectivePicker
                          inputId={field.id}
                          collective={field.value}
                          disabled={field.disabled || account.length === 1}
                          error={field.error}
                          collectives={account}
                          onChange={({ value }) => setFieldValue(field.name, value)}
                          onBlur={() => setFieldTouched(field.name, true)}
                        />
                      ) : (
                        <CollectivePickerAsync
                          inputId={field.id}
                          collective={field.value}
                          disabled={field.disabled || Boolean(account)}
                          error={field.error}
                          onBlur={() => setFieldTouched(field.name, true)}
                          onChange={({ value }) => setFieldValue(field.name, value)}
                          hostCollectiveIds={[host.legacyId]}
                          preload
                        />
                      )
                    }
                  </StyledInputFormikField>
                  <StyledInputFormikField
                    name="payee"
                    label={<FormattedMessage defaultMessage="Payee" id="SecurityScope.Payee" />}
                  >
                    {({ field }) => (
                      <PayeeSelect
                        inputId={field.id}
                        error={field.error}
                        onBlur={() => setFieldTouched(field.name, true)}
                        onChange={({ value }) => setFieldValue(field.name, value)}
                        host={host}
                        forAccount={values.account as Account}
                        disabled={field.disabled}
                        collective={field.value}
                      />
                    )}
                  </StyledInputFormikField>
                  {host?.accountingCategories?.totalCount > 0 && (
                    <StyledInputFormikField
                      name="accountingCategory"
                      label={
                        <FormattedMessage defaultMessage="Accounting category" id="AddFundsModal.accountingCategory" />
                      }
                    >
                      {({ field }) => (
                        <AccountingCategorySelect
                          id={field.id}
                          kind="EXPENSE"
                          host={host}
                          disabled={!values.account}
                          account={values.account as null | Account}
                          expenseType={values.type}
                          expenseValues={values}
                          selectedCategory={field.value}
                          onChange={category => setFieldValue(field.name, category)}
                          buttonClassName="max-w-full"
                          predictionStyle="inline-preload"
                          showCode
                          allowNone
                        />
                      )}
                    </StyledInputFormikField>
                  )}
                  <StyledInputFormikField
                    required={values.type === ExpenseType.RECEIPT}
                    name="attachedFile"
                    label={
                      values.type === ExpenseType.RECEIPT ? (
                        <FormattedMessage defaultMessage="Receipt" id="Expense.Receipt" />
                      ) : (
                        <FormattedMessage defaultMessage="Attachment" id="Expense.Attachment" />
                      )
                    }
                  >
                    {({ form, field, meta }) => (
                      <Dropzone
                        {...attachmentDropzoneParams}
                        kind="EXPENSE_ITEM"
                        data-cy={`${field.name}-dropzone`}
                        name={field.name}
                        isMulti={false}
                        error={(meta.touched || form.submitCount) && meta.error}
                        mockImageGenerator={() => `https://loremflickr.com/120/120/invoice?lock=0`}
                        value={field.value && isValidUrl(field.value?.url) && field.value.url}
                        useGraphQL={true}
                        parseDocument={false}
                        onGraphQLSuccess={uploadResults => {
                          const uploadedFile = uploadResults[0].file;
                          setFieldValue(field.name, uploadedFile);
                        }}
                        onReject={msg => {
                          toast({ variant: 'error', message: msg });
                        }}
                      />
                    )}
                  </StyledInputFormikField>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-4 border-t border-t-1 border-solid border-t-slate-100 pt-4">
                <Button onClick={() => setOpen(false)} type="button" variant="outline" disabled={isSubmitting}>
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </Button>
                <Button data-cy="add-funds-submit-btn" type="submit" loading={isSubmitting}>
                  <FormattedMessage defaultMessage="Create expense" id="YUK+rq" />
                </Button>
              </div>
            </Form>
          )}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
};
