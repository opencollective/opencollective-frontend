import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form } from 'formik';
import { groupBy, map, omit, pick } from 'lodash';
import { Lock, Unlock } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '../../../../lib/collective';
import { i18nGraphqlException } from '../../../../lib/errors';
import { standardizeExpenseItemIncurredAt } from '../../../../lib/expenses';
import type {
  Account,
  Host,
  TransactionsImport,
  TransactionsImportRow,
  TransactionsImportStats,
} from '../../../../lib/graphql/types/v2/graphql';
import { Currency, ExpenseType } from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { isValidUrl } from '../../../../lib/utils';
import { attachmentDropzoneParams } from '../../../expenses/lib/attachments';
import { formatCurrency } from '@/lib/currency-utils';
import type { AccountingCategory } from '@/lib/graphql/types/v2/graphql';
import type { PossiblyArray } from '@/lib/types';

import AccountingCategorySelect from '@/components/AccountingCategorySelect';
import { Button } from '@/components/ui/Button';

import CollectivePicker, { DefaultCollectiveLabel } from '../../../CollectivePicker';
import CollectivePickerAsync from '../../../CollectivePickerAsync';
import Dropzone from '../../../Dropzone';
import { FormikZod } from '../../../FormikZod';
import type { BaseModalProps } from '../../../ModalContext';
import { StyledInputAmountWithDynamicFxRate } from '../../../StyledInputAmountWithDynamicFxRate';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledSelect from '../../../StyledSelect';
import { Dialog, DialogContent, DialogHeader } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';
import { TransactionsImportRowDetails } from '../transactions-imports/TransactionsImportRowDetailsAccordion';

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

const SUPPORTED_EXPENSE_TYPES = [ExpenseType.CHARGE, ExpenseType.GRANT, ExpenseType.INVOICE, ExpenseType.RECEIPT];

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
        type: z.enum(SUPPORTED_EXPENSE_TYPES.filter(type => type !== ExpenseType.RECEIPT) as [string, ...string[]]),
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
  const [isAmountLocked, setIsAmountLocked] = React.useState(Boolean(transactionsImportRow?.amount?.valueInCents));
  const [createExpense, { client }] = useMutation(hostCreateExpenseMutation);
  const { toast } = useToast();
  const expenseTypeOptions = React.useMemo(
    () => SUPPORTED_EXPENSE_TYPES.map(value => getExpenseTypeOption(intl, value)),
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
          <TransactionsImportRowDetails transactionsImportRow={transactionsImportRow} className="mb-4" />
        )}
        <FormikZod<FormValuesSchema>
          schema={hostExpenseFormValuesSchema}
          initialValues={getInitialValues(transactionsImportRow, account)}
          onSubmit={async values => {
            try {
              const embedFileInItems = [ExpenseType.RECEIPT, ExpenseType.CHARGE].includes(values.type);
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
                      isSaved: false,
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
                        url: embedFileInItems ? values['attachedFile']?.url : null,
                      },
                    ],
                    attachedFiles:
                      embedFileInItems || !values['attachedFile'] ? [] : [pick(values['attachedFile'], ['url'])],
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
          {({ isSubmitting, setFieldValue, setFieldTouched, values }) => {
            const hasChangedAmount = Boolean(
              transactionsImportRow?.amount?.valueInCents &&
              (Math.abs(transactionsImportRow.amount.valueInCents) !== values.amount.valueInCents ||
                transactionsImportRow.amount.currency !== values.amount.currency),
            );

            return (
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
                        <div>
                          <div className="flex justify-between gap-2 [&>div]:w-full">
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
                              disabled={isAmountLocked || field.disabled}
                              date={values.incurredAt}
                            />
                            {Boolean(transactionsImportRow?.amount?.valueInCents) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-[38px]"
                                onClick={() => setIsAmountLocked(locked => !locked)}
                                aria-label={isAmountLocked ? 'Unlock amount field' : 'Lock amount field'}
                                disabled={hasChangedAmount}
                              >
                                {isAmountLocked ? <Unlock size={18} /> : <Lock size={18} />}
                              </Button>
                            )}
                          </div>
                          {Boolean(transactionsImportRow?.amount?.valueInCents) &&
                            (isAmountLocked ? (
                              <span className="mt-1 text-xs text-gray-500">
                                <FormattedMessage defaultMessage="Unlock the field to edit the amount." id="hmdkRP" />
                              </span>
                            ) : (
                              hasChangedAmount && (
                                <span className="mt-1 text-xs text-gray-500">
                                  <FormattedMessage
                                    defaultMessage="The initial amount was {amount}"
                                    id="+EJXC5"
                                    values={{
                                      amount: formatCurrency(
                                        Math.abs(transactionsImportRow.amount.valueInCents),
                                        transactionsImportRow.amount.currency,
                                        { locale: intl.locale },
                                      ),
                                    }}
                                  />
                                  {' - '}
                                  <Button
                                    variant="link"
                                    size="xs"
                                    className="p-0 text-xs"
                                    onClick={() => {
                                      setFieldValue('amount', {
                                        valueInCents: Math.abs(transactionsImportRow.amount.valueInCents),
                                        currency: transactionsImportRow.amount.currency,
                                      });
                                      setIsAmountLocked(true);
                                    }}
                                  >
                                    <FormattedMessage defaultMessage="Revert" id="amT0Gh" />
                                  </Button>
                                </span>
                              )
                            ))}
                        </div>
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
                          <FormattedMessage
                            defaultMessage="Accounting category"
                            id="AddFundsModal.accountingCategory"
                          />
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
                        values.type === ExpenseType.RECEIPT || values.type === ExpenseType.CHARGE ? (
                          <FormattedMessage defaultMessage="Receipt" id="Expense.Receipt" />
                        ) : (
                          <FormattedMessage defaultMessage="Attachment" id="Expense.Attachment" />
                        )
                      }
                    >
                      {({ form, field, meta }) => (
                        <div>
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
                          {values.type === ExpenseType.CHARGE && !field.value && (
                            <div className="mt-2 text-sm text-neutral-600">
                              <FormattedMessage
                                defaultMessage="If no receipt is provided, collective admins will have to provide one."
                                id="WmyjIg"
                              />
                            </div>
                          )}
                        </div>
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
            );
          }}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
};
