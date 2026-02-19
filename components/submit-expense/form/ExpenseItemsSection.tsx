/* eslint-disable prefer-arrow-callback */
import React, { useId } from 'react';
import { GST_RATE_PERCENT, TaxType } from '@opencollective/taxes';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { getEmojiByCurrencyCode } from 'country-currency-emoji-flags';
import { useFormikContext } from 'formik';
import { get, isNil, pick, round, truncate } from 'lodash';
import { ArrowDown, ArrowUp, Coins, Plus, Trash2 } from 'lucide-react';
import FlipMove from 'react-flip-move';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import dayjs from '../../../lib/dayjs';
import type { Currency, CurrencyExchangeRateInput } from '../../../lib/graphql/types/v2/graphql';
import {
  AccountType,
  CurrencyExchangeRateSourceType,
  ExpenseLockableFields,
} from '../../../lib/graphql/types/v2/graphql';
import { getIntlDisplayNames } from '../../../lib/i18n';
import { i18nTaxType } from '../../../lib/i18n/taxes';
import { attachmentDropzoneParams } from '../../expenses/lib/attachments';
import {
  FX_RATE_ERROR_THRESHOLD,
  getExpenseExchangeRateWarningOrError,
  getTaxAmount,
  isTaxRateValid,
} from '../../expenses/lib/utils';
import { DISABLE_ANIMATIONS } from '@/lib/animations';
import { cn } from '@/lib/utils';

import { FormField } from '@/components/FormField';
import PrivateInfoIcon from '@/components/icons/PrivateInfoIcon';
import InputAmount from '@/components/InputAmount';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioGroupCard } from '@/components/ui/RadioGroup';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

import Dropzone, { MemoizedDropzone } from '../../Dropzone';
import { ExchangeRate } from '../../ExchangeRate';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import MessageBox from '../../MessageBox';
import StyledSelect from '../../StyledSelect';
import { Button } from '../../ui/Button';
import { Input, InputGroup } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { useToast } from '../../ui/useToast';
import { Step } from '../SubmitExpenseFlowSteps';
import { type ExpenseForm } from '../useExpenseForm';

import { FormSectionContainer } from './FormSectionContainer';
import { memoWithGetFormProps } from './helper';
import { privateInfoYouCollectiveAndHost } from './PrivateInfoMessages';

type ExpenseItemsSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function ExpenseItemsSection(props: ExpenseItemsSectionProps) {
  return (
    <FormSectionContainer
      step={Step.EXPENSE_ITEMS}
      inViewChange={props.inViewChange}
      subtitle={<FormattedMessage defaultMessage="Add the expense items that you’d like to be paid for" id="ox+mWM" />}
    >
      <React.Fragment>
        <ExpenseItemsForm {...ExpenseItemsForm.getFormProps(props.form)} />

        <div className="my-4 border-t border-gray-200" />
        <AdditionalAttachments {...AdditionalAttachments.getFormProps(props.form)} />
      </React.Fragment>
    </FormSectionContainer>
  );
}

function getExpenseItemFormProps(form: ExpenseForm) {
  return {
    ...pick(form, ['setFieldValue', 'initialLoading', 'isSubmitting']),
    ...pick(form.options, [
      'expenseCurrency',
      'totalInvoicedInExpenseCurrency',
      'taxType',
      'lockedFields',
      'availableReferenceCurrencies',
    ]),
    ...pick(form.values, ['tax', 'hasTax', 'expenseItems', 'referenceCurrency']),
    expenseItemCount: form.values.expenseItems?.length || 0,
    payoutMethodCurrency:
      form.options.payoutMethod?.data?.currency || form.options.expense?.payoutMethod?.data?.currency,
    collectiveCurrency: form.options.account?.currency,
  };
}

export const ExpenseItemsForm = memoWithGetFormProps(function ExpenseItemsForm(
  props: ReturnType<typeof getExpenseItemFormProps>,
) {
  const intl = useIntl();
  const expenseItems = props.expenseItems;
  const { setFieldValue } = props;

  const isAmountLocked = props.lockedFields?.includes?.(ExpenseLockableFields.AMOUNT);

  return (
    <React.Fragment>
      {!props.initialLoading && (
        <div role="list">
          <FlipMove enterAnimation="fade" leaveAnimation="fade" disableAllAnimations={DISABLE_ANIMATIONS}>
            {expenseItems?.map((ei, i) => {
              return (
                <div key={ei.key} id={ei.key} role="listitem" className="flex gap-4">
                  <div className="grow">
                    <ExpenseItemWrapper
                      index={i}
                      isAmountLocked={isAmountLocked}
                      isSubjectToTax={Boolean(props.taxType)}
                    />
                  </div>
                  <div className={cn('flex flex-col gap-1', { hidden: expenseItems.length < 2 })}>
                    <Button
                      onClick={() => {
                        setFieldValue('expenseItems', [...expenseItems.slice(0, i), ...expenseItems.slice(i + 1)]);
                      }}
                      disabled={expenseItems.length === 1 || isAmountLocked || props.isSubmitting}
                      variant="outline"
                      size="icon-sm"
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Button
                      onClick={() => {
                        if (i > 0) {
                          const newExpenseItems = [...expenseItems];
                          [newExpenseItems[i - 1], newExpenseItems[i]] = [newExpenseItems[i], newExpenseItems[i - 1]];
                          setFieldValue('expenseItems', newExpenseItems);
                        }
                      }}
                      disabled={i === 0 || props.isSubmitting}
                      variant="outline"
                      size="icon-sm"
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      onClick={() => {
                        if (i < expenseItems.length - 1) {
                          const newExpenseItems = [...expenseItems];
                          [newExpenseItems[i + 1], newExpenseItems[i]] = [newExpenseItems[i], newExpenseItems[i + 1]];
                          setFieldValue('expenseItems', newExpenseItems);
                        }
                      }}
                      disabled={i === expenseItems.length - 1 || props.isSubmitting}
                      variant="outline"
                      size="icon-sm"
                    >
                      <ArrowDown size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </FlipMove>
        </div>
      )}

      {props.initialLoading && (
        <div className="mb-4">
          <Skeleton className="h-30 w-full" />
        </div>
      )}

      {props.availableReferenceCurrencies && props.availableReferenceCurrencies.length > 1 && (
        <ReferenceCurrencySelector
          referenceCurrency={props.referenceCurrency}
          availableReferenceCurrencies={props.availableReferenceCurrencies}
          setFieldValue={setFieldValue}
          isSubmitting={props.isSubmitting}
          payoutMethodCurrency={props.payoutMethodCurrency}
        />
      )}

      <div className="flex flex-wrap justify-between gap-2 md:pr-12">
        <Button
          variant="outline"
          className="shrink-0"
          disabled={props.initialLoading || isAmountLocked || props.isSubmitting}
          data-cy="expense-add-item-btn"
          onClick={() =>
            setFieldValue('expenseItems', [
              ...expenseItems,
              {
                key: uuid(),
                description: '',
                incurredAt: new Date().toISOString(),
                attachment: null,
                amount: {
                  valueInCents: 0,
                  currency:
                    props.referenceCurrency ||
                    props.availableReferenceCurrencies[0] ||
                    props.expenseCurrency ||
                    props.collectiveCurrency,
                },
              },
            ])
          }
        >
          <Plus size={16} /> <FormattedMessage defaultMessage="Add item" id="KDO3hW" />
        </Button>
        <div className="flex-grow">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right">
            {props.hasTax && props.tax && (
              <React.Fragment>
                <div>
                  <FormattedMessage defaultMessage="Subtotal:" id="WWhVAU" />
                </div>
                <div>
                  <FormattedMoneyAmount
                    amount={props.totalInvoicedInExpenseCurrency}
                    precision={2}
                    currency={props.expenseCurrency}
                    showCurrencyCode
                  />
                </div>
              </React.Fragment>
            )}
            {props.hasTax && props.tax && (
              <React.Fragment>
                <span className="captilize">
                  {i18nTaxType(intl, props.taxType, 'short')}
                  {isTaxRateValid(props.tax.rate) && ` (${round(props.tax.rate * 100, 2)}%)`}:
                </span>
                <div>
                  <FormattedMoneyAmount
                    amount={
                      !isTaxRateValid(props.tax.rate)
                        ? null
                        : getTaxAmount(props.totalInvoicedInExpenseCurrency, props.tax)
                    }
                    precision={2}
                    currency={props.expenseCurrency}
                    showCurrencyCode
                  />
                </div>
              </React.Fragment>
            )}

            <div className="col-span-2 text-right">
              <FormattedMoneyAmount
                amount={
                  props.hasTax && props.tax && isTaxRateValid(props.tax.rate)
                    ? getTaxAmount(props.totalInvoicedInExpenseCurrency, props.tax) +
                      props.totalInvoicedInExpenseCurrency
                    : props.totalInvoicedInExpenseCurrency
                }
                precision={2}
                currency={props.expenseCurrency}
                showCurrencyCode
                amountClassName="font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {props.taxType && (
        <React.Fragment>
          <div className="my-4 border-t border-gray-200" />
          <Taxes
            hasTax={props.hasTax}
            taxType={props.taxType}
            setFieldValue={setFieldValue}
            tax={props.tax}
            isSubmitting={props.isSubmitting}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}, getExpenseItemFormProps);

type ExpenseItemProps = {
  index: number;
  isAmountLocked?: boolean;
  isDateLocked?: boolean;
  isDescriptionLocked?: boolean;
  item: ExpenseForm['values']['expenseItems'][number];
  isSubjectToTax?: boolean;
} & ReturnType<typeof getExpenseItemProps>;

function getExpenseItemProps(form: ExpenseForm) {
  return {
    payeeType: form.options.payee?.type,
    ...pick(form, ['setFieldValue', 'isSubmitting', 'setFieldTouched']),
    ...pick(form.options, [
      'allowExpenseItemAttachment',
      'isAdminOfPayee',
      'expenseCurrency',
      'allowDifferentItemCurrency',
      'isLongFormItemDescription',
      'hasExpenseItemDate',
    ]),
  };
}

export function ExpenseItemWrapper(props: {
  index: number;
  isAmountLocked?: boolean;
  isDateLocked?: boolean;
  isDescriptionLocked?: boolean;
  isSubjectToTax?: boolean;
}) {
  const form = useFormikContext() as ExpenseForm;
  return (
    <ExpenseItem
      index={props.index}
      item={get(form.values, `expenseItems.${props.index}`)}
      isAmountLocked={props.isAmountLocked}
      isDateLocked={props.isDateLocked}
      isDescriptionLocked={props.isDescriptionLocked}
      isSubjectToTax={props.isSubjectToTax}
      {...ExpenseItem.getFormProps(form)}
    />
  );
}

const ExpenseItem = memoWithGetFormProps(function ExpenseItem(props: ExpenseItemProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const item = props.item;

  const hasAttachment = props.allowExpenseItemAttachment;
  const attachmentId = useId();

  const { setFieldValue, setFieldTouched } = props;

  const onCurrencyChange = React.useCallback(
    v => {
      setFieldTouched('expenseItems');
      setFieldValue(`expenseItems.${props.index}.amount.currency`, v);
    },
    [props.index, setFieldValue, setFieldTouched],
  );

  const onGraphQLSuccess = React.useCallback(
    uploadResults => {
      setFieldValue(`expenseItems.${props.index}.attachment`, uploadResults[0].file);
    },
    [setFieldValue, props.index],
  );

  const onSuccess = React.useCallback(
    file => {
      setFieldValue(`expenseItems.${props.index}.attachment`, file);
    },
    [setFieldValue, props.index],
  );

  const onReject = React.useCallback(
    msg => {
      toast({ variant: 'error', message: msg });
    },
    [toast],
  );

  const onAmountChange = React.useCallback(
    v => {
      setFieldValue(`expenseItems.${props.index}.amount.valueInCents`, v);
    },
    [setFieldValue, props.index],
  );

  const onExchangeRateChange = React.useCallback(
    exchangeRate => {
      setFieldValue(`expenseItems.${props.index}.amount.exchangeRate`, exchangeRate);
    },
    [setFieldValue, props.index],
  );

  if (!item) {
    return null;
  }

  return (
    <div className="@container mb-4 rounded-md border border-slate-300 p-4">
      <div className="flex flex-col gap-4 @md:flex-row">
        {hasAttachment && (
          <div className="flex flex-col">
            <div className="flex grow justify-center">
              <FormField
                disabled={props.isSubmitting}
                label={intl.formatMessage({ defaultMessage: 'Upload file', id: '6oOCCL' })}
                name={`expenseItems.${props.index}.attachment`}
                isPrivate
                privateMessage={privateInfoYouCollectiveAndHost}
              >
                {({ field }) => {
                  return (
                    <MemoizedDropzone
                      {...attachmentDropzoneParams}
                      {...field}
                      disabled={props.isSubmitting}
                      kind="EXPENSE_ITEM"
                      id={attachmentId}
                      name={attachmentId}
                      value={typeof item.attachment === 'string' ? item.attachment : item.attachment?.url}
                      isMulti={false}
                      showActions
                      className="size-28"
                      useGraphQL={true}
                      parseDocument={false}
                      onGraphQLSuccess={onGraphQLSuccess}
                      onSuccess={onSuccess}
                      onReject={onReject}
                    />
                  );
                }}
              </FormField>
            </div>
          </div>
        )}
        <div className="@container grow">
          <div className="mb-2">
            <FormField
              required={props.isAdminOfPayee || props.payeeType === AccountType.VENDOR}
              disabled={props.isDescriptionLocked || props.isSubmitting}
              label={intl.formatMessage({ defaultMessage: 'Item Description', id: 'xNL/oy' })}
              placeholder={intl.formatMessage({ defaultMessage: 'Enter what best describes the item', id: '/eapvj' })}
              name={`expenseItems.${props.index}.description`}
            >
              {({ field }) => {
                if (props.isLongFormItemDescription) {
                  return <Textarea {...field} />;
                }
                return <Input {...field} />;
              }}
            </FormField>
          </div>
          <div className="flex flex-col gap-4 @md:grid @md:grid-cols-3">
            {props.hasExpenseItemDate && (
              <FormField
                required={props.isAdminOfPayee || props.payeeType === AccountType.VENDOR}
                disabled={props.isDateLocked || props.isSubmitting}
                label={intl.formatMessage({ defaultMessage: 'Date', id: 'expense.incurredAt' })}
                name={`expenseItems.${props.index}.incurredAt`}
              >
                {({ field }) => {
                  return <Input type="date" max={dayjs().format('YYYY-MM-DD')} {...field} />;
                }}
              </FormField>
            )}

            <div className="col-span-2 flex flex-col">
              <FormField
                disabled={props.isAmountLocked || props.isSubmitting}
                label={
                  props.isSubjectToTax
                    ? intl.formatMessage({ defaultMessage: 'Gross Amount', id: 'bwZInO' })
                    : intl.formatMessage({ defaultMessage: 'Amount', id: 'Fields.amount' })
                }
                name={`expenseItems.${props.index}.amount.valueInCents`}
              >
                {({ field }) => (
                  <InputAmount
                    {...field}
                    currencyDisplay="FULL"
                    hasCurrencyPicker={props.allowDifferentItemCurrency}
                    currency={item.amount.currency}
                    onCurrencyChange={onCurrencyChange}
                    value={item.amount.valueInCents}
                    onChange={onAmountChange}
                    exchangeRate={item.amount.currency !== props.expenseCurrency && get(item, `amount.exchangeRate`, 0)}
                    minFxRate={
                      (item.amount?.referenceExchangeRate && 'value' in item.amount.referenceExchangeRate
                        ? item.amount.referenceExchangeRate.value || 0
                        : 0) *
                        (1 - FX_RATE_ERROR_THRESHOLD) || undefined
                    }
                    maxFxRate={
                      (item.amount?.referenceExchangeRate && 'value' in item.amount.referenceExchangeRate
                        ? item.amount.referenceExchangeRate.value || 0
                        : 0) *
                        (1 + FX_RATE_ERROR_THRESHOLD) || undefined
                    }
                    onExchangeRateChange={onExchangeRateChange}
                  />
                )}
              </FormField>

              <div className="self-end">
                {Boolean(
                  item.amount?.currency && props.expenseCurrency !== item.amount?.currency && props.expenseCurrency,
                ) && (
                  <ExchangeRate
                    className="mt-2 text-muted-foreground"
                    {...getExpenseExchangeRateWarningOrError(
                      intl,
                      item.amount.exchangeRate,
                      item.amount.referenceExchangeRate,
                    )}
                    exchangeRate={
                      (item.amount.exchangeRate || {
                        source: CurrencyExchangeRateSourceType.USER,
                        fromCurrency: item.amount.currency as Currency,
                        toCurrency: props.expenseCurrency,
                      }) as CurrencyExchangeRateInput
                    }
                    approximateCustomMessage={
                      <FormattedMessage
                        defaultMessage="This value is an estimate. Please set the exact amount received if known."
                        id="zNBAqh"
                      />
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, getExpenseItemProps);

type AdditionalAttachmentsProps = ReturnType<typeof getAdditionalAttachmentFormProps>;

function getAdditionalAttachmentFormProps(form: ExpenseForm) {
  return {
    ...pick(form, ['initialLoading', 'setFieldValue', 'isSubmitting']),
    ...pick(form.values, ['additionalAttachments']),
  };
}

export const AdditionalAttachments = memoWithGetFormProps(function AdditionalAttachments(
  props: AdditionalAttachmentsProps,
) {
  const { toast } = useToast();
  const { additionalAttachments, setFieldValue } = props;

  const onGraphQLSuccess = React.useCallback(
    uploadResults => {
      setFieldValue('additionalAttachments', [...(additionalAttachments || []), ...uploadResults.map(up => up.file)]);
    },
    [setFieldValue, additionalAttachments],
  );

  const onReject = React.useCallback(
    msg => {
      toast({ variant: 'error', message: msg });
    },
    [toast],
  );

  const onSuccessEmpty = React.useCallback(() => {}, []);

  return (
    <div>
      <Label htmlFor="additionalAttachments" className="mt-5 mb-1 flex items-center gap-2">
        <FormattedMessage defaultMessage="Additional Attachments (Optional)" id="n3evmu" />
        <PrivateInfoIcon>{privateInfoYouCollectiveAndHost}</PrivateInfoIcon>
      </Label>
      <div className="flex flex-wrap gap-4 pt-2">
        <div>
          <Dropzone
            {...attachmentDropzoneParams}
            id="additionalAttachments"
            name="additionalAttachments"
            kind="EXPENSE_ATTACHED_FILE"
            className="size-28"
            isMulti
            disabled={props.initialLoading || props.isSubmitting}
            isLoading={props.initialLoading}
            useGraphQL={true}
            parseDocument={false}
            onGraphQLSuccess={onGraphQLSuccess}
            onSuccess={onSuccessEmpty}
            onReject={onReject}
          />
        </div>

        {additionalAttachments?.map(at => (
          <div key={typeof at === 'string' ? at : at.id}>
            <Dropzone
              {...attachmentDropzoneParams}
              disabled={props.isSubmitting}
              name={typeof at === 'string' ? at : at.name}
              className="size-28"
              value={typeof at === 'string' ? at : at?.url}
              collectFilesOnly
              showActions
              showReplaceAction={false}
              onSuccess={() => {
                setFieldValue(
                  'additionalAttachments',
                  additionalAttachments.filter(f => f !== at),
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}, getAdditionalAttachmentFormProps);

const i18nTaxRate = (intl: IntlShape, taxType: TaxType, rate: number) => {
  if (rate) {
    return `${rate * 100}%`;
  } else {
    return intl.formatMessage(
      { defaultMessage: 'No {taxName}', id: 'lTGBvW' },
      { taxName: i18nTaxType(intl, taxType, 'short') },
    );
  }
};

const ReferenceCurrencySelector = React.memo(function ReferenceCurrencySelector(props: {
  setFieldValue: ExpenseForm['setFieldValue'];
  isSubmitting: ExpenseForm['isSubmitting'];
  referenceCurrency: Currency;
  availableReferenceCurrencies: Currency[];
  payoutMethodCurrency?: Currency;
}) {
  const intl = useIntl();
  const { setFieldValue } = props;

  const onCurrencyChange = React.useCallback(
    (currency: Currency) => {
      if (currency) {
        setFieldValue('referenceCurrency', currency);
      }
    },
    [setFieldValue],
  );

  // Generate currency options for RadioGroup
  const currencyOptions = React.useMemo(() => {
    const currencyDisplayNames = getIntlDisplayNames(intl.locale, 'currency');
    return props.availableReferenceCurrencies.map(currency => {
      const currencyName = currencyDisplayNames.of(currency);
      const emoji = getEmojiByCurrencyCode(currency);
      return {
        value: currency,
        label: (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center gap-1">
              {emoji && <span className="flex-shrink-0">{emoji}</span>}
              <span className="text-sm font-semibold text-foreground">{currency}</span>
            </div>
            <span className="text-xs leading-tight text-muted-foreground">
              {truncate(currencyName, { length: 30 })}
            </span>
          </div>
        ),
      };
    });
  }, [intl.locale, props.availableReferenceCurrencies]);

  return (
    <MessageBox type="info" className="mb-6">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="input-referenceCurrency">
          <Coins className="h-4 w-4" />
          <FormattedMessage defaultMessage="Payment currency" id="6uc7kW" />
        </label>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <FormattedMessage
            defaultMessage="Your expense items use multiple currencies. Select the currency in which you wish to get paid, other amounts will be converted automatically."
            id="okSLzP"
          />
        </p>
        <FormField name="referenceCurrency">
          {() => (
            <RadioGroup
              value={props.referenceCurrency}
              onValueChange={onCurrencyChange}
              disabled={props.isSubmitting}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-cy="reference-currency-picker"
            >
              {currencyOptions.map(option => (
                <RadioGroupCard
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:scale-[1.02] hover:bg-muted/50 hover:shadow-sm"
                  data-cy={`reference-currency-option-${option.value}`}
                >
                  {option.label}
                </RadioGroupCard>
              ))}
            </RadioGroup>
          )}
        </FormField>
      </div>
      {props.referenceCurrency &&
        props.payoutMethodCurrency &&
        props.payoutMethodCurrency !== props.referenceCurrency && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground italic">
            <FormattedMessage
              defaultMessage="Please note that your payout method currency is in {currency}. The actual amount you receive will depend on exchange rates and fees collected by payment processors and banks."
              id="uzfoYE"
              values={{
                currency: props.payoutMethodCurrency,
              }}
            />
          </p>
        )}
    </MessageBox>
  );
});

const Taxes = React.memo(function Taxes(props: {
  setFieldValue: ExpenseForm['setFieldValue'];
  isSubmitting: ExpenseForm['isSubmitting'];
  tax: ExpenseForm['values']['tax'];
  hasTax: ExpenseForm['values']['hasTax'];
  taxType: ExpenseForm['options']['taxType'];
}) {
  const intl = useIntl();
  const { setFieldValue } = props;
  const onHasTaxChange = React.useCallback(
    (checked: CheckedState) => {
      setFieldValue('hasTax', Boolean(checked));
      if (props.taxType === TaxType.GST) {
        setFieldValue('tax', { rate: GST_RATE_PERCENT, idNumber: '', ...props.tax });
      } else if (props.taxType === TaxType.VAT) {
        setFieldValue('tax', { rate: null, idNumber: '', ...props.tax });
      }
    },
    [setFieldValue, props.taxType, props.tax],
  );

  return (
    <div>
      <FormField label={intl.formatMessage({ defaultMessage: 'Taxes', id: 'r+dgiv' })} name="hasTax">
        {() => (
          <div className="items-top mt-1 flex items-center space-x-2">
            <Checkbox
              id="hasTax"
              name="hasTax"
              disabled={props.isSubmitting}
              checked={props.hasTax}
              onCheckedChange={onHasTaxChange}
            />
            <Label className="font-normal" htmlFor="hasTax">
              <FormattedMessage
                defaultMessage="Apply {taxName}"
                id="0JzeTD"
                values={{
                  taxName: i18nTaxType(intl, props.taxType),
                }}
              />
            </Label>
          </div>
        )}
      </FormField>

      <div className="items-top mt-4 flex flex-wrap gap-4">
        <div>
          {props.hasTax && props.taxType === TaxType.GST && (
            <FormField
              name="tax.rate"
              disabled={props.isSubmitting}
              htmlFor={`input-${props.taxType}-rate`}
              label={intl.formatMessage(
                { defaultMessage: '{taxName} rate', id: 'Gsyrfa' },
                { taxName: i18nTaxType(intl, props.taxType, 'short') },
              )}
              inputType="number"
            >
              {({ field }) => (
                <StyledSelect
                  disabled={props.isSubmitting}
                  inputId={`input-${props.taxType}-rate`}
                  required={true}
                  minWidth={115}
                  value={{
                    value: round(field.value * 100, 2),
                    label: i18nTaxRate(intl, props.taxType, field.value),
                  }}
                  onChange={({ value }) => props.setFieldValue('tax.rate', value)}
                  options={[0, GST_RATE_PERCENT].map(rate => ({
                    value: rate,
                    label: i18nTaxRate(intl, props.taxType, rate),
                  }))}
                />
              )}
            </FormField>
          )}

          {props.hasTax && props.taxType === TaxType.VAT && (
            <FormField
              name="tax.rate"
              disabled={props.isSubmitting}
              htmlFor={`input-${props.taxType}-rate`}
              label={intl.formatMessage(
                { defaultMessage: '{taxName} rate', id: 'Gsyrfa' },
                { taxName: i18nTaxType(intl, props.taxType, 'short') },
              )}
              inputType="number"
            >
              {({ field }) => (
                <InputGroup
                  {...field}
                  value={isNil(field.value) ? '' : round(field.value * 100, 2)}
                  onChange={e => props.setFieldValue('tax.rate', round(Number(e.target.value) / 100, 4))}
                  minWidth={65}
                  append="%"
                  min={0}
                  max={100}
                  step="0.01"
                />
              )}
            </FormField>
          )}
        </div>

        {props.hasTax && (
          <div>
            <FormField
              name="tax.idNumber"
              htmlFor={`input-${props.taxType}-idNumber`}
              label={intl.formatMessage(
                { defaultMessage: '{taxName} identifier', id: 'Byg+S/' },
                { taxName: i18nTaxType(intl, props.taxType, 'short') },
              )}
              placeholder={intl.formatMessage(
                { id: 'examples', defaultMessage: 'e.g., {examples}' },
                { examples: props.taxType === TaxType.VAT ? 'EU000011111' : '123456789' },
              )}
              disabled={props.isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
});
