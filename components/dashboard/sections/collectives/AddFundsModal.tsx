import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Form, Formik } from 'formik';
import { get, isEmpty } from 'lodash';
import { ArrowLeft, Lock, PlusCircle, Unlock } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getLegacyIdForCollective } from '../../../../lib/collective';
import { formatCurrency } from '../../../../lib/currency-utils';
import { getCurrentLocalDateStr } from '../../../../lib/date-utils';
import { requireFields } from '../../../../lib/form-utils';
import { API_V1_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type {
  Account,
  Amount,
  Order,
  Tier,
  TierReferenceInput,
  TransactionReferenceInput,
  VendorFieldsFragment,
} from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { i18nTaxType } from '../../../../lib/i18n/taxes';
import { require2FAForAdmins } from '../../../../lib/policies';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';
import { i18nGraphqlException } from '@/lib/errors';

import { I18nBold } from '@/components/I18nFormatters';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/useToast';
import { vendorFieldFragment } from '@/components/vendors/queries';

import { AccountHoverCard, accountHoverCardFields } from '../../../AccountHoverCard';
import AccountingCategorySelect from '../../../AccountingCategorySelect';
import Avatar from '../../../Avatar';
import { collectivePageQuery, getCollectivePageQueryVariables } from '../../../collective-page/graphql/queries';
import { getBudgetSectionQuery, getBudgetSectionQueryVariables } from '../../../collective-page/sections/Budget';
import CollectivePicker, { CUSTOM_OPTIONS_POSITION, DefaultCollectiveLabel } from '../../../CollectivePicker';
import CollectivePickerAsync from '../../../CollectivePickerAsync';
import Container from '../../../Container';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Flex } from '../../../Grid';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledHr from '../../../StyledHr';
import StyledInput from '../../../StyledInput';
import StyledInputAmount from '../../../StyledInputAmount';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledInputPercentage from '../../../StyledInputPercentage';
import StyledLink from '../../../StyledLink';
import StyledModal, { ModalBody, ModalHeader } from '../../../StyledModal';
import StyledSelect from '../../../StyledSelect';
import StyledTextarea from '../../../StyledTextarea';
import StyledTooltip from '../../../StyledTooltip';
import { TaxesFormikFields, validateTaxInput } from '../../../taxes/TaxesFormikFields';
import { P, Span } from '../../../Text';
import { TwoFactorAuthRequiredMessage } from '../../../TwoFactorAuthRequiredMessage';
import { Button } from '../../../ui/Button';
import { TransactionsImportRowDetails } from '../transactions-imports/TransactionsImportRowDetailsAccordion';

const AddFundsModalContainer = styled(StyledModal)<{ $showSuccessModal: boolean }>`
  width: 100%;
  max-width: 576px;
  padding: 24px 24px 16px 32px;
  ${props =>
    props.$showSuccessModal &&
    css`
      background-image: url('/static/images/platform-tip-background.png');
      background-repeat: no-repeat;
      background-size: 100%;
      background-position: left 0 top 0;
    `}
`;

const AmountDetailsLine = ({
  label,
  value,
  currency,
  isLargeAmount,
}: {
  label: React.ReactNode;
  value: number;
  currency: string;
  isLargeAmount?: boolean;
}) => (
  <Flex justifyContent="space-between" alignItems="center">
    <Span fontSize="12px" lineHeight="18px" fontWeight="500">
      <FormattedMessage id="withColon" defaultMessage="{item}:" values={{ item: label }} />
    </Span>
    <Span fontSize={isLargeAmount ? '18px' : '12px'} lineHeight={isLargeAmount ? '27px' : '18px'} fontWeight="500">
      <FormattedMoneyAmount amount={value} currency={currency} />
    </Span>
  </Flex>
);

const addFundsOrderFieldsFragment = gql`
  fragment AddFundsOrderFields on Order {
    id
    description
    memo
    processedAt
    hostFeePercent
    totalAmount {
      valueInCents
    }
    paymentProcessorFee {
      valueInCents
    }
    taxAmount {
      valueInCents
    }
    transactions {
      id
      type
      kind
      amount {
        valueInCents
      }
    }
    fromAccount {
      id
      slug
      name
    }
    toAccount {
      id
      slug
      name
      stats {
        id
        balance {
          valueInCents
        }
      }
    }
    accountingCategory {
      id
      code
      name
      kind
    }
    tier {
      id
      legacyId
      slug
      name
    }
  }
`;

const addFundsMutation = gql`
  mutation AddFunds(
    $fromAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $tier: TierReferenceInput
    $amount: AmountInput!
    $paymentProcessorFee: AmountInput
    $description: String!
    $memo: String
    $processedAt: DateTime
    $hostFeePercent: Float!
    $invoiceTemplate: String
    $tax: TaxInput
    $accountingCategory: AccountingCategoryReferenceInput
    $transactionsImportRow: TransactionsImportRowReferenceInput
  ) {
    addFunds(
      account: $account
      fromAccount: $fromAccount
      amount: $amount
      paymentProcessorFee: $paymentProcessorFee
      description: $description
      memo: $memo
      processedAt: $processedAt
      hostFeePercent: $hostFeePercent
      tier: $tier
      invoiceTemplate: $invoiceTemplate
      tax: $tax
      accountingCategory: $accountingCategory
      transactionsImportRow: $transactionsImportRow
    ) {
      id
      ...AddFundsOrderFields
    }
  }
  ${addFundsOrderFieldsFragment}
`;

const editAddedFundsMutation = gql`
  mutation EditAddedFunds(
    $order: OrderReferenceInput!
    $fromAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $tier: TierReferenceInput
    $amount: AmountInput!
    $paymentProcessorFee: AmountInput
    $description: String!
    $memo: String
    $processedAt: DateTime
    $hostFeePercent: Float!
    $invoiceTemplate: String
    $tax: TaxInput
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    editAddedFunds(
      order: $order
      account: $account
      fromAccount: $fromAccount
      amount: $amount
      paymentProcessorFee: $paymentProcessorFee
      description: $description
      memo: $memo
      processedAt: $processedAt
      hostFeePercent: $hostFeePercent
      tier: $tier
      invoiceTemplate: $invoiceTemplate
      tax: $tax
      accountingCategory: $accountingCategory
    ) {
      id
      ...AddFundsOrderFields
    }
  }
  ${addFundsOrderFieldsFragment}
`;

const addFundsTierFieldsFragment = gql`
  fragment AddFundsTierFields on Tier {
    id
    slug
    legacyId
    name
  }
`;

const addFundsAccountQueryHostFieldsFragment = gql`
  fragment AddFundsAccountQueryHostFields on Host {
    id
    type
    legacyId
    slug
    name
    settings
    plan {
      id
      hostFees
    }
    policies {
      id
      REQUIRE_2FA_FOR_ADMINS
    }
    isTrustedHost
    vendors(forAccount: { slug: $slug }) {
      nodes {
        id
        slug
        name
        type
        description
        imageUrl(height: 64)
      }
    }
    orderAccountingCategories: accountingCategories(kind: [CONTRIBUTION, ADDED_FUNDS]) {
      nodes {
        id
        code
        name
        friendlyName
        kind
        appliesTo
      }
    }
  }
`;

const addFundsAccountQuery = gql`
  query AddFundsAccount($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      type
      isHost
      name
      slug
      currency
      settings
      ...AccountHoverCardFields
      ... on Organization {
        tiers {
          nodes {
            id
            ...AddFundsTierFields
          }
        }
        host {
          ...AddFundsAccountQueryHostFields
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          name
          imageUrl
          type
          settings
          ...AccountHoverCardFields

          childrenAccounts {
            nodes {
              id
              slug
              name
              imageUrl
              type
            }
          }
        }
      }
      childrenAccounts {
        nodes {
          id
          slug
          name
          imageUrl
          type
        }
      }
      ... on Host {
        ...AddFundsAccountQueryHostFields
      }
      ... on AccountWithHost {
        addedFundsHostFeePercent: hostFeePercent(paymentMethodType: HOST)
        host {
          ...AddFundsAccountQueryHostFields
        }
      }
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            ...AddFundsTierFields
          }
        }
      }
    }
  }
  ${addFundsTierFieldsFragment}
  ${addFundsAccountQueryHostFieldsFragment}
  ${accountHoverCardFields}
`;

type FundDetails = {
  showSuccessModal?: boolean;
  fundAmount?: number;
  taxAmount?: Amount;
  hostFeePercent?: number;
  paymentProcessorFee?: Amount;
  taxes?: any[];
  description?: string;
  memo?: string;
  processedAt?: string;
  source?: any;
  tier?: Tier;
};

type AddFundsFormValues = {
  amount: number;
  fromAccount: Account;
  description: string;
  processedAt: string;
  account?: Account;
  paymentProcessorFee?: number;
  hostFeePercent?: number;
  memo?: string;
  tier?: TierReferenceInput;
  tax?: any;
  transactionsImportRow?: TransactionReferenceInput | null;
  invoiceTemplate?: { value: string };
  accountingCategory?: { id: string };
  hasHostFee?: boolean;
  hasPaymentProcessorFee?: boolean;
};

const getInitialValues = (values): AddFundsFormValues => ({
  amount: null,
  paymentProcessorFee: null,
  hostFeePercent: null,
  description: '',
  memo: null,
  processedAt: getCurrentLocalDateStr(),
  fromAccount: null,
  tier: null,
  tax: null,
  hasHostFee: !!values.hostFeePercent,
  hasPaymentProcessorFee: !!values.paymentProcessorFee,
  ...values,
});

const validate = (intl, values) => {
  const errors = requireFields(values, [
    'amount',
    'fromAccount',
    'description',
    'processedAt',
    'add-funds-confirm-checkbox',
  ]);
  const taxErrors = validateTaxInput(intl, values.tax, { requireTaxIdNumber: false });
  if (!isEmpty(taxErrors)) {
    errors['tax'] = taxErrors;
  }

  return errors;
};

const getApplicableTaxType = (collective, host) => {
  if (!collective) {
    return null;
  } else if (accountHasVAT(collective, host || collective.host)) {
    return TaxType.VAT;
  } else if (accountHasGST(host || collective.host || collective)) {
    return TaxType.GST;
  }
};

// Build an account reference. Compatible with accounts from V1 and V2.
const buildAccountReference = input => {
  return typeof input.id === 'string' ? { id: input.id } : { legacyId: input.id };
};

const getTiersOptions = (intl, tiers) => {
  if (!tiers) {
    return [];
  }

  return [
    {
      value: null,
      label: intl.formatMessage({ defaultMessage: 'No tier', id: 'ozkv/Y' }),
    },
    ...tiers.map(tier => ({
      value: tier,
      label: `#${tier.legacyId} - ${tier.name}`,
    })),
  ];
};

const Field = styled(StyledInputFormikField).attrs({
  labelFontSize: '16px',
  labelFontWeight: '700',
})``;

const checkCanAddHostFee = account => {
  // No host, or no account, no host fees
  if (!account?.host) {
    return false;
  }

  if (account.parent) {
    // No host fees for child of independent collective
    return account.host.id !== account.parent.id;
  }

  // No host fees for Host Organizations
  return account.host.id !== account.id;
};

const AddFundsModalContentWithCollective = ({
  collective,
  fundDetails,
  setFundDetails,
  handleClose,
  onSelectOtherAccount,
  initialValues,
  onSuccess,
  editOrderId,
}: {
  collective: Pick<Account, 'slug'>;
  fundDetails: FundDetails;
  setFundDetails: React.Dispatch<React.SetStateAction<FundDetails>>;
  handleClose: () => void;
  onSelectOtherAccount?: () => void;
  initialValues?: Partial<AddFundsFormValues>;
  onSuccess?: (order: Order) => void;
  editOrderId?: string;
}) => {
  const intl = useIntl();
  const [isAmountLocked, setIsAmountLocked] = React.useState(Boolean(initialValues?.amount));
  const {
    data,
    loading,
    error: fetchAccountError,
  } = useQuery(addFundsAccountQuery, {
    variables: { slug: collective.slug },
  });
  const account = data?.account;
  const currency = account?.currency;
  const host = account?.isHost && !account.host ? account : account?.host;
  const applicableTax = getApplicableTaxType(account, host);
  const isEdit = Boolean(editOrderId);

  const [createVendor, { loading: isCreatingVendor }] = useMutation(gql`
    mutation CreateAddFundsVendor($vendor: VendorCreateInput!, $host: AccountReferenceInput!) {
      createVendor(host: $host, vendor: $vendor) {
        id
        ...VendorFields
      }
    }
    ${vendorFieldFragment}
  `);

  const onCreateVendorClick = React.useCallback(
    async (
      searchText: string,
      { onSuccess, onError }: { onSuccess: (vendor: VendorFieldsFragment) => void; onError: (error: Error) => void },
    ) => {
      try {
        const result = await createVendor({
          variables: {
            vendor: {
              name: searchText,
            },
            host: { id: host.id },
          },
        });

        toast({
          variant: 'success',
          message: intl.formatMessage({ defaultMessage: 'Vendor created', id: 'Ra9inC' }),
        });
        onSuccess(result.data.createVendor);
      } catch (error) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, error),
        });
        onError(error);
      }
    },
    [createVendor, host?.id, intl],
  );

  const [submitAddFunds, { error: fundError, loading: isLoading }] = useMutation(
    isEdit ? editAddedFundsMutation : addFundsMutation,
    {
      refetchQueries: [
        {
          query: getBudgetSectionQuery(true, false),
          variables: getBudgetSectionQueryVariables(collective.slug, false, host),
        },
        {
          query: collectivePageQuery,
          context: API_V1_CONTEXT,
          variables: getCollectivePageQueryVariables(collective.slug),
        },
      ],
      awaitRefetchQueries: true,
    },
  );

  const tiersNodes = get(data, 'account.tiers.nodes');
  const tiersOptions = React.useMemo(() => getTiersOptions(intl, tiersNodes), [intl, tiersNodes]);

  // From the Collective page we pass collective as API v1 objects
  // From the Host dashboard we pass collective as API v2 objects
  const canAddHostFee = checkCanAddHostFee(account);
  const hostFeePercent = account?.addedFundsHostFeePercent;
  const defaultHostFeePercent = canAddHostFee ? hostFeePercent : 0;
  const receiptTemplates = host?.settings?.invoice?.templates;

  const toCollective = account?.parent ? account.parent : account;
  const accountOptions = toCollective?.childrenAccounts?.nodes || [];

  const receiptTemplateTitles = [];
  if (receiptTemplates?.default?.title?.length > 0) {
    receiptTemplateTitles.push({
      value: 'default',
      label: receiptTemplates?.default?.title,
    });
  }
  if (receiptTemplates?.alternative?.title?.length > 0) {
    receiptTemplateTitles.push({ value: 'alternative', label: receiptTemplates?.alternative?.title });
  }

  if (loading) {
    return (
      <div className="space-y-8 py-8">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  } else if (fetchAccountError) {
    return <MessageBoxGraphqlError my={2} error={fetchAccountError} />;
  }

  return (
    <Formik
      initialValues={getInitialValues({ hostFeePercent: defaultHostFeePercent, account, ...initialValues })}
      enableReinitialize={true}
      validate={values => validate(intl, values)}
      onSubmit={async (values, formik) => {
        if (!fundDetails.showSuccessModal) {
          const defaultInvoiceTemplate = receiptTemplateTitles.length > 0 ? receiptTemplateTitles[0].value : null;
          const result = await submitAddFunds({
            variables: {
              ...values,
              amount: { valueInCents: values.amount, currency },
              paymentProcessorFee: values.paymentProcessorFee
                ? { valueInCents: values.paymentProcessorFee, currency }
                : null,
              platformTip: { valueInCents: 0 },
              fromAccount: buildAccountReference(values.fromAccount),
              account: buildAccountReference(values.account),
              tier: !values.tier ? null : { id: values.tier.id },
              invoiceTemplate: values.invoiceTemplate?.value || defaultInvoiceTemplate,
              processedAt: values.processedAt ? new Date(values.processedAt) : null,
              tax: values.tax,
              accountingCategory: values.accountingCategory ? { id: values.accountingCategory.id } : null,
              ...(isEdit && { order: { id: editOrderId } }),
            },
          });

          const resultOrder = result.data.addFunds || result.data.editAddedFunds;

          if (!isEdit) {
            setFundDetails({
              showSuccessModal: true,
              fundAmount: values.amount,
              taxAmount: resultOrder.taxAmount,
              hostFeePercent: resultOrder.hostFeePercent,
              paymentProcessorFee: resultOrder.transactions.find(
                t => t.kind === 'PAYMENT_PROCESSOR_FEE' && t.type === 'DEBIT',
              )?.amount,
              taxes: resultOrder.taxes,
              description: resultOrder.description,
              memo: resultOrder.memo,
              processedAt: resultOrder.processedAt,
              source: resultOrder.fromAccount,
              tier: resultOrder.tier,
            });
            /*
             * Since `enableReinitialize` is used in this form, during the second step (platform tip step)
             * the form values will be reset. The validate function in this form
             * requires `amount`, `fromAccount` and `description` so we should
             * set them as otherwise the form will not be submittable.
             */
            formik.setValues({
              amount: values.amount,
              fromAccount: resultOrder.fromAccount,
              description: resultOrder.description,
              processedAt: resultOrder.processedAt,
            });
          }
          onSuccess?.(resultOrder);
          if (isEdit) {
            handleClose();
          }
        } else {
          handleClose();
        }
      }}
    >
      {formik => {
        const { values, isSubmitting } = formik;
        const hostFeePercent = isNaN(values.hostFeePercent) ? defaultHostFeePercent : values.hostFeePercent;
        const taxAmount = !values.tax?.rate ? 0 : Math.round(values.amount - values.amount / (1 + values.tax.rate));
        const paymentProcessorFee = values.paymentProcessorFee || 0;
        const hostFee = Math.round((values.amount - taxAmount) * (hostFeePercent / 100));
        const loading = isLoading || isSubmitting;

        if (!fundDetails.showSuccessModal) {
          return (
            <Form data-cy="add-funds-form" className="flex h-full flex-col overflow-y-hidden">
              {onSelectOtherAccount && (
                <div className="flex">
                  <Button
                    type="button"
                    variant="link"
                    onClick={onSelectOtherAccount}
                    data-cy="add-funds-select-other-account"
                    className="mb-3 p-0"
                  >
                    <ArrowLeft size={16} />
                    <FormattedMessage id="AddFundsModal.selectOtherAccount" defaultMessage="Select another account" />
                  </Button>
                </div>
              )}

              <div className="w-full grow space-y-8 overflow-y-auto pb-4">
                <AddFundsFormSection title={<FormattedMessage defaultMessage="To" id="To" />}>
                  <Field
                    name="collective"
                    htmlFor="addFunds-collective"
                    label={<FormattedMessage defaultMessage="Collective" id="Collective" />}
                    mt={3}
                  >
                    {() => (
                      <AccountHoverCard
                        account={toCollective}
                        trigger={
                          <div className="flex items-center gap-2">
                            <Avatar collective={toCollective} radius={20} />
                            <span>{toCollective.name}</span>
                          </div>
                        }
                      />
                    )}
                  </Field>
                  {accountOptions.length > 0 && (
                    <Field
                      name="account"
                      htmlFor="addFunds-account"
                      label={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
                      mt={3}
                    >
                      {({ form, field }) => (
                        <CollectivePicker
                          inputId={field.id}
                          data-cy="add-funds-recipient"
                          error={field.error}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                          onChange={({ value }) => form.setFieldValue(field.name, value)}
                          collective={values.account}
                          collectives={[toCollective, ...accountOptions]}
                          menuPortalTarget={null}
                          customOptionsPosition={CUSTOM_OPTIONS_POSITION.TOP}
                          formatOptionLabel={(option, context) => {
                            if (option.value.slug === toCollective.slug) {
                              return DefaultCollectiveLabel(
                                {
                                  value: {
                                    ...option.value,
                                    name: intl.formatMessage({
                                      defaultMessage: 'Main account',
                                      id: 'AccountType.MainAccount',
                                    }),
                                  },
                                },
                                context,
                              );
                            }
                            return DefaultCollectiveLabel({ value: option.value }, context);
                          }}
                        />
                      )}
                    </Field>
                  )}
                  {tiersOptions.length > 1 && (
                    <Field
                      name="tier"
                      htmlFor="addFunds-tier"
                      label={<FormattedMessage defaultMessage="Tier" id="b07w+D" />}
                      mt={3}
                      required={false}
                    >
                      {({ form, field }) => (
                        <StyledSelect
                          inputId={field.id}
                          data-cy="add-funds-tier"
                          error={field.error}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                          onChange={({ value }) => form.setFieldValue(field.name, value)}
                          isLoading={loading}
                          options={tiersOptions}
                          isSearchable={tiersOptions.length > 10}
                          value={tiersOptions.find(option =>
                            !values.tier ? option.value === null : option.value?.id === values.tier.id,
                          )}
                        />
                      )}
                    </Field>
                  )}
                </AddFundsFormSection>

                <AddFundsFormSection title={<FormattedMessage defaultMessage="From" id="dM+p3/" />}>
                  <Field
                    name="fromAccount"
                    htmlFor="addFunds-fromAccount"
                    label={
                      host?.isTrustedHost ? (
                        <FormattedMessage defaultMessage="Source" id="AddFundsModal.source" />
                      ) : (
                        <FormattedMessage defaultMessage="Vendor" id="dU1t5Z" />
                      )
                    }
                    mt={3}
                  >
                    {({ form, field }) => (
                      <div>
                        <CollectivePickerAsync
                          loading={isCreatingVendor}
                          inputId={field.id}
                          data-cy="add-funds-source"
                          types={host?.isTrustedHost ? ['VENDOR', 'ORGANIZATION'] : ['VENDOR']}
                          error={field.error}
                          onBlur={() => form.setFieldTouched(field.name, true)}
                          onChange={({ value }) => {
                            form.setFieldValue(field.name, value);
                          }}
                          collective={values.fromAccount}
                          menuPortalTarget={null}
                          includeVendorsForHostId={host?.legacyId || undefined}
                          creatable={['VENDOR']}
                          HostCollectiveId={host?.legacyId}
                          renderNewCollectiveOption={({ searchText, onCreatedCollective }) => {
                            if (searchText.length > 0) {
                              return (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  loading={isCreatingVendor}
                                  className="flex w-full items-center justify-between gap-2 text-sm text-gray-500"
                                  onClick={() =>
                                    onCreateVendorClick(searchText, {
                                      onSuccess: vendor => {
                                        onCreatedCollective(vendor);
                                      },
                                      onError: () => {},
                                    })
                                  }
                                >
                                  <span>
                                    <FormattedMessage
                                      defaultMessage="Create vendor: <b>{vendorName}</b>"
                                      id="buY7Uz"
                                      values={{ vendorName: searchText, b: I18nBold }}
                                    />
                                  </span>
                                  <PlusCircle size={16} />
                                </Button>
                              );
                            }

                            return (
                              <div>
                                <FormattedMessage defaultMessage="Begin typing to create a vendor" id="Jx28lM" />
                              </div>
                            );
                          }}
                          formatOptionLabel={(option, context) => {
                            if (context.context === 'value') {
                              return (
                                <div className="flex items-center justify-between gap-2">
                                  {DefaultCollectiveLabel(option, context)}
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="p-0"
                                    onMouseDown={e => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      form.setFieldValue('fromAccount', null);
                                    }}
                                  >
                                    <FormattedMessage defaultMessage="Remove" id="Remove" />
                                  </Button>
                                </div>
                              );
                            }

                            return DefaultCollectiveLabel(option, context);
                          }}
                        />
                      </div>
                    )}
                  </Field>
                </AddFundsFormSection>
                <AddFundsFormSection title={<FormattedMessage defaultMessage="Amounts and fees" id="bg5yQv" />}>
                  <Field
                    name="amount"
                    htmlFor="addFunds-amount"
                    label={<FormattedMessage defaultMessage="Gross Amount" id="bwZInO" />}
                    required
                    flex="1 1"
                  >
                    {({ form, field }) => (
                      <div>
                        <div className="flex justify-between gap-2 [&>div]:w-full">
                          <StyledInputAmount
                            id={field.id}
                            data-cy="add-funds-amount"
                            currency={currency}
                            error={field.error}
                            value={field.value}
                            maxWidth="100%"
                            onChange={value => form.setFieldValue(field.name, value)}
                            onBlur={() => form.setFieldTouched(field.name, true)}
                            disabled={isAmountLocked}
                          />
                          {Boolean(initialValues?.amount) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-[38px]"
                              onClick={() => setIsAmountLocked(locked => !locked)}
                              disabled={initialValues.amount !== values.amount}
                              aria-label={isAmountLocked ? 'Unlock amount field' : 'Lock amount field'}
                            >
                              {isAmountLocked ? <Unlock size={18} /> : <Lock size={18} />}
                            </Button>
                          )}
                        </div>
                        {Boolean(initialValues?.amount) &&
                          (isAmountLocked ? (
                            <span className="mt-1 text-xs text-gray-500">
                              <FormattedMessage defaultMessage="Unlock the field to edit the amount." id="hmdkRP" />
                            </span>
                          ) : (
                            initialValues.amount !== values.amount && (
                              <span className="mt-1 text-xs text-gray-500">
                                <FormattedMessage
                                  defaultMessage="The initial amount was {amount}."
                                  id="6hEUR9"
                                  values={{
                                    amount: formatCurrency(initialValues.amount, currency, { locale: intl.locale }),
                                  }}
                                />
                                {' - '}
                                <Button
                                  variant="link"
                                  size="xs"
                                  className="p-0 text-xs"
                                  onClick={() => {
                                    formik.setFieldValue('amount', initialValues.amount);
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
                  </Field>

                  {canAddHostFee && (
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor="hasHostFee">
                          <div className="flex items-center gap-2 text-base font-bold">
                            <FormattedMessage defaultMessage="Host Fee" id="NJsELs" />
                            <StyledTooltip
                              content={() => (
                                <FormattedMessage
                                  id="AddFundsModal.hostFee.tooltip"
                                  defaultMessage="The default host fee percentage is set up in your host settings. The host fee is charged by the fiscal host to the collectives for the financial services provided."
                                />
                              )}
                            >
                              <InfoCircle size={16} />
                            </StyledTooltip>
                          </div>
                          <div className="text-sm text-gray-500">
                            <FormattedMessage defaultMessage="Collect host fees" id="o9dDdX" />
                          </div>
                        </label>
                        <Switch
                          id="hasHostFee"
                          name="hostHostFee"
                          checked={formik.values.hasHostFee}
                          onCheckedChange={checked => {
                            formik.setFieldValue('hasHostFee', checked);
                            if (!checked) {
                              formik.setFieldValue('hostFeePercent', 0);
                            } else {
                              formik.setFieldValue('hostFeePercent', defaultHostFeePercent);
                            }
                          }}
                        />
                      </div>

                      {formik.values.hasHostFee && (
                        <Field
                          name="hostFeePercent"
                          htmlFor="addFunds-hostFeePercent"
                          className="mt-4 flex justify-end"
                        >
                          {({ form, field }) => (
                            <StyledInputPercentage
                              id={field.id}
                              placeholder={defaultHostFeePercent}
                              value={field.value}
                              error={field.error}
                              onChange={value => form.setFieldValue(field.name, value)}
                              onBlur={() => form.setFieldTouched(field.name, true)}
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  )}

                  <div className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="hasPaymentProcessorFee">
                        <div className="flex items-center gap-2 text-base font-bold">
                          <FormattedMessage defaultMessage="Payment Processor Fee" id="pzs6YY" />
                        </div>
                        <div className="text-sm text-gray-500">
                          <FormattedMessage defaultMessage="Deduct fee amount" id="ue3ZR1" />
                        </div>
                      </label>
                      <Switch
                        id="hasPaymentProcessorFee"
                        name="hasPaymentProcessorFee"
                        checked={formik.values.hasPaymentProcessorFee}
                        onCheckedChange={checked => {
                          formik.setFieldValue('hasPaymentProcessorFee', checked);
                          if (!checked) {
                            formik.setFieldValue('paymentProcessorFee', 0);
                          }
                        }}
                      />
                    </div>

                    {formik.values.hasPaymentProcessorFee && (
                      <Field
                        name="paymentProcessorFee"
                        htmlFor="addFunds-paymentProcessorFee"
                        flex="1 1"
                        className="mt-4 flex justify-end"
                        required={false}
                      >
                        {({ form, field }) => (
                          <StyledInputAmount
                            id={field.id}
                            data-cy="add-funds-paymentProcessorFee"
                            currency={currency}
                            error={field.error}
                            value={field.value}
                            maxWidth="100%"
                            onChange={value => form.setFieldValue(field.name, value)}
                            onBlur={() => form.setFieldTouched(field.name, true)}
                          />
                        )}
                      </Field>
                    )}
                  </div>

                  {applicableTax && (
                    <TaxesFormikFields
                      taxType={applicableTax}
                      formik={formik}
                      formikValuePath="tax"
                      isOptional
                      dispatchDefaultValueOnMount={false}
                      labelProps={{ fontSize: '16px', fontWeight: '700' }}
                      idNumberLabelRenderer={shortTaxTypeLabel =>
                        intl.formatMessage(
                          { defaultMessage: "Source's {taxName} identifier", id: 'TNecsq' },
                          { taxName: shortTaxTypeLabel },
                        )
                      }
                    />
                  )}
                  <p className="text-md leading-4 font-bold">
                    <FormattedMessage defaultMessage="Summary" id="Summary" />
                  </p>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <AmountDetailsLine
                      value={values.amount || 0}
                      currency={currency}
                      label={<FormattedMessage id="AddFundsModal.fundingAmount" defaultMessage="Funding amount" />}
                    />
                    {Boolean(values.tax?.rate) && (
                      <React.Fragment>
                        <AmountDetailsLine
                          value={-taxAmount}
                          currency={currency}
                          label={`${i18nTaxType(intl, values.tax.type, 'long')} (${Math.round(values.tax.rate * 100)}%)`}
                        />
                        <StyledHr my={1} borderColor="black.200" />
                        <AmountDetailsLine
                          value={(values.amount || 0) - taxAmount}
                          currency={currency}
                          label={
                            <FormattedMessage
                              defaultMessage="Gross amount without {taxName}"
                              id="dcUpWf"
                              values={{ taxName: i18nTaxType(intl, values.tax.type, 'short') }}
                            />
                          }
                        />
                        {canAddHostFee && <StyledHr my={1} borderColor="black.200" />}
                      </React.Fragment>
                    )}
                    {canAddHostFee && (
                      <AmountDetailsLine
                        value={!hostFee ? 0 : -hostFee}
                        currency={currency}
                        label={
                          <FormattedMessage
                            id="AddFundsModal.hostFees"
                            defaultMessage="Host fee charged to collective ({hostFees})"
                            values={{ hostFees: `${hostFeePercent || 0}%` }}
                          />
                        }
                      />
                    )}
                    {Boolean(paymentProcessorFee) && (
                      <AmountDetailsLine
                        value={-paymentProcessorFee}
                        currency={currency}
                        label={<FormattedMessage defaultMessage="Payment Processor Fee" id="pzs6YY" />}
                      />
                    )}
                    <StyledHr my={2} borderColor="black.300" />
                    <AmountDetailsLine
                      value={values.amount - hostFee - taxAmount - (values.paymentProcessorFee || 0)}
                      currency={currency}
                      label={
                        <FormattedMessage
                          id="AddFundsModal.netAmount"
                          defaultMessage="Net amount received by collective"
                        />
                      }
                      isLargeAmount
                    />
                  </div>
                </AddFundsFormSection>

                <AddFundsFormSection title={<FormattedMessage defaultMessage="Accounting" id="home.accounting" />}>
                  <Field
                    name="processedAt"
                    htmlFor="addFunds-processedAt"
                    inputType="date"
                    label={
                      <span>
                        <FormattedMessage defaultMessage="Effective Date" id="Gh3Obs" />
                        {` `}
                        <StyledTooltip
                          content={() => (
                            <FormattedMessage
                              defaultMessage="The date funds were cleared on your bank, Wise, PayPal, Stripe or any other external account holding these funds."
                              id="s3O6iq"
                            />
                          )}
                        >
                          <InfoCircle size={16} />
                        </StyledTooltip>
                      </span>
                    }
                    mt={3}
                  >
                    {({ field }) => <StyledInput data-cy="add-funds-processedAt" {...field} />}
                  </Field>
                  {account?.host?.orderAccountingCategories?.nodes?.length > 0 && (
                    <Field
                      name="accountingCategory"
                      htmlFor="addFunds-accountingCategory"
                      required={false}
                      label={
                        <FormattedMessage id="AddFundsModal.accountingCategory" defaultMessage="Accounting category" />
                      }
                      mt={3}
                    >
                      {({ form, field }) => (
                        <AccountingCategorySelect
                          id={field.id}
                          kind="CONTRIBUTION"
                          onChange={value => form.setFieldValue(field.name, value)}
                          host={host}
                          account={account}
                          selectedCategory={field.value}
                          allowNone={true}
                          showCode={true}
                          buttonClassName="max-w-[auto]"
                        />
                      )}
                    </Field>
                  )}
                  <Field
                    name="description"
                    htmlFor="addFunds-description"
                    label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
                    mt={3}
                  >
                    {({ field }) => <StyledInput data-cy="add-funds-description" {...field} />}
                  </Field>
                  <Field
                    name="memo"
                    htmlFor="addFunds-memo"
                    isPrivate
                    label={<FormattedMessage defaultMessage="Memo" id="D5NqQO" />}
                    required={false}
                    mt={3}
                  >
                    {({ field }) => <StyledTextarea data-cy="add-funds-memo" {...field} />}
                  </Field>
                  {receiptTemplateTitles.length > 1 && (
                    <Container width="100%">
                      <Field
                        name="invoiceTemplate"
                        htmlFor="addFunds-invoiceTemplate"
                        label={<FormattedMessage defaultMessage="Choose receipt" id="cyMx/0" />}
                        mt={3}
                      >
                        {({ form, field }) => (
                          <StyledSelect
                            id={field.id}
                            options={receiptTemplateTitles}
                            defaultValue={receiptTemplateTitles[0]}
                            onChange={value => form.setFieldValue(field.name, value)}
                          />
                        )}
                      </Field>
                    </Container>
                  )}
                </AddFundsFormSection>

                <P fontSize="12px" lineHeight="18px" color="black.700" mt={2}>
                  {isEdit ? (
                    <Field
                      type="checkbox"
                      id="add-funds-confirm-checkbox"
                      name="add-funds-confirm-checkbox"
                      required
                      data-cy="add-funds-confirm-checkbox"
                    >
                      {({ field }) => (
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={field.id}
                            checked={field.value}
                            onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                          />
                          <label htmlFor={field.id} className="flex cursor-pointer items-start gap-2 select-none">
                            <FormattedMessage
                              id="AddFundsModal.editDisclaimer"
                              defaultMessage="By clicking edit funds, you're reverting the existing related transactions (including any fees incurred by them) and creating new ones."
                            />
                          </label>
                        </div>
                      )}
                    </Field>
                  ) : (
                    <Field
                      type="checkbox"
                      id="add-funds-confirm-checkbox"
                      name="add-funds-confirm-checkbox"
                      required
                      data-cy="add-funds-confirm-checkbox"
                    >
                      {({ field }) => (
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={field.id}
                            checked={field.value}
                            onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                          />
                          <label htmlFor={field.id} className="flex cursor-pointer items-start gap-2 select-none">
                            <FormattedMessage
                              defaultMessage="I confirm that by clicking 'Add Funds', I am responsible for managing {amount} on behalf of this collective"
                              id="Evxi/Q"
                              values={{ amount: formatCurrency(values.amount, currency, { locale: intl.locale }) }}
                            />
                          </label>
                        </div>
                      )}
                    </Field>
                  )}
                </P>
                {fundError && <MessageBoxGraphqlError error={fundError} mt={3} fontSize="13px" />}
              </div>
              <div className="border-t-dark-400 flex justify-between gap-4 border-t border-solid pt-4">
                <Button onClick={handleClose} type="button" variant="outline">
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </Button>
                <Button data-cy="add-funds-submit-btn" type="submit" loading={loading}>
                  {isEdit ? (
                    <FormattedMessage id="menu.editFunds" defaultMessage="Edit Funds" />
                  ) : (
                    <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
                  )}{' '}
                </Button>
              </div>
            </Form>
          );
        } else {
          return (
            <Form>
              <ModalBody data-cy="funds-added">
                <Container>
                  <h3 className="mt-4 text-xl text-black">
                    <FormattedMessage id="AddFundsModal.FundsAdded" defaultMessage="Funds Added ✅" />
                  </h3>
                  <Container pb={2} mt={3}>
                    <FormattedMessage id="AddFundsModal.YouAdded" defaultMessage="You added:" />
                    <ul className="mt-2 list-inside list-disc pl-3 break-words">
                      <li>
                        <strong>{`${fundDetails.fundAmount / 100} ${currency}`}</strong>
                      </li>
                      {Boolean(fundDetails.taxAmount) && (
                        <li>
                          <FormattedMessage
                            defaultMessage="Including {amount} {feeType} ({feeRate})"
                            id="9kR30C"
                            values={{
                              amount: (
                                <FormattedMoneyAmount
                                  amount={fundDetails.taxAmount.valueInCents}
                                  currency={currency}
                                  showCurrencyCode={false}
                                />
                              ),
                              feeType: i18nTaxType(intl, get(fundDetails.taxes, '0.type') || 'Tax', 'long'),
                              feeRate: `${get(fundDetails.taxes, '0.percentage')}%`,
                            }}
                          />
                        </li>
                      )}
                      {Boolean(fundDetails.hostFeePercent) && (
                        <li>
                          <FormattedMessage
                            defaultMessage="Including {amount} {feeType} ({feeRate})"
                            id="9kR30C"
                            values={{
                              amount: (
                                <FormattedMoneyAmount
                                  currency={currency}
                                  showCurrencyCode={false}
                                  amount={
                                    (fundDetails.fundAmount - (fundDetails.taxAmount?.valueInCents || 0)) *
                                    (fundDetails.hostFeePercent / 100)
                                  }
                                />
                              ),
                              feeType: <FormattedMessage id="HostFee" defaultMessage="Host fee" />,
                              feeRate: `${fundDetails.hostFeePercent}%`,
                            }}
                          />
                        </li>
                      )}
                      {Boolean(fundDetails.paymentProcessorFee?.valueInCents) && (
                        <li>
                          <FormattedMessage
                            defaultMessage="Including {amount} {feeType}"
                            id="vK8Lti"
                            values={{
                              amount: (
                                <FormattedMoneyAmount
                                  currency={currency}
                                  showCurrencyCode={false}
                                  amount={-fundDetails.paymentProcessorFee.valueInCents}
                                />
                              ),
                              feeType: (
                                <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
                              ),
                            }}
                          />
                        </li>
                      )}
                      <li>
                        <FormattedMessage id="AddFundsModal.FromTheSource" defaultMessage="From the source" />{' '}
                        <strong>
                          <LinkCollective collective={fundDetails.source} />
                        </strong>
                      </li>
                      <li>
                        <FormattedMessage id="AddFundsModal.ForThePurpose" defaultMessage="For the purpose of" />{' '}
                        <strong>{fundDetails.description}</strong>
                      </li>
                      {fundDetails.processedAt && (
                        <li>
                          <Span textTransform="capitalize">
                            <FormattedMessage id="processedAt" defaultMessage="Fund received date" />
                          </Span>
                          {': '}
                          <strong>{intl.formatDate(fundDetails.processedAt, { timeZone: 'UTC' })}</strong>
                        </li>
                      )}
                      {fundDetails.tier && (
                        <li>
                          <FormattedMessage defaultMessage="For the tier" id="h+1vQB" />{' '}
                          <StyledLink
                            as={Link}
                            openInNewTab
                            href={`${getCollectivePageRoute(account)}/contribute/${fundDetails.tier.slug}-${
                              fundDetails.tier.legacyId
                            }`}
                          >
                            <strong>{fundDetails.tier.name}</strong>
                          </StyledLink>
                        </li>
                      )}
                      {fundDetails.memo && (
                        <li>
                          <FormattedMessage
                            id="withColon"
                            defaultMessage="{item}:"
                            values={{ item: <FormattedMessage defaultMessage="Memo" id="D5NqQO" /> }}
                          />
                          <p
                            className="text-black-600 border-black-200 mt-1 max-h-32 overflow-y-auto rounded border bg-neutral-50 p-2 text-xs break-words whitespace-pre-wrap"
                            data-cy="add-funds-memo"
                          >
                            {fundDetails.memo}
                          </p>
                        </li>
                      )}
                    </ul>
                  </Container>
                  <Container pb={2} mt={2}>
                    <FormattedMessage id="AddFundsModal.NeedHelp" defaultMessage="Need Help?" />{' '}
                    <StyledLink href="/support" buttonStyle="standard" buttonSize="tiny">
                      <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
                    </StyledLink>
                  </Container>
                </Container>
              </ModalBody>
              <div className="flex justify-center gap-4">
                {!fundDetails.showSuccessModal && (
                  <Button onClick={handleClose} type="button">
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </Button>
                )}
                <Button type="button" onClick={handleClose} data-cy="add-platform-tip-btn" loading={loading}>
                  <FormattedMessage id="Finish" defaultMessage="Finish" />
                </Button>
              </div>
            </Form>
          );
        }
      }}
    </Formik>
  );
};

function getDefaultSelectedCollective<T>(collective: Array<T> | T): T | null {
  if (Array.isArray(collective)) {
    return collective.length === 1 ? collective[0] : null;
  } else {
    return collective;
  }
}

const AddFundsModal = ({
  collective = null,
  host = null,
  initialValues = null,
  onSuccess = null,
  transactionsImportRow = null,
  ...props
}: {
  collective: Pick<Account, 'slug' | 'name'> | Pick<Account, 'slug' | 'name'>[] | null;
  host?: Pick<Account, 'id' | 'legacyId' | 'slug' | 'policies'> | null;
  initialValues?: Partial<AddFundsFormValues>;
  onSuccess?: (order: Order) => void;
  transactionsImportRow?: TransactionReferenceInput &
    React.ComponentProps<typeof TransactionsImportRowDetails>['transactionsImportRow'];
  editOrderId?: string;
  onClose: () => void;
}) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const [selectedCollective, setSelectedCollective] = useState(() => getDefaultSelectedCollective(collective));
  const [hasConfirmedCollective, setHasConfirmedCollective] = useState(Boolean(selectedCollective));
  const [fundDetails, setFundDetails] = useState<FundDetails>({});
  const handleClose = () => {
    setFundDetails({ showSuccessModal: false });
    props.onClose();
  };

  return (
    <AddFundsModalContainer
      key="add-funds-modal"
      {...props}
      onClose={handleClose}
      $showSuccessModal={fundDetails.showSuccessModal}
    >
      {selectedCollective && !props.editOrderId ? (
        <ModalHeader className="mb-4" onClose={handleClose}>
          <FormattedMessage defaultMessage="Add Funds" id="menu.addFunds" />
        </ModalHeader>
      ) : (
        <ModalHeader onClose={handleClose} mb={3}>
          {props.editOrderId ? (
            <FormattedMessage id="menu.editFunds" defaultMessage="Edit Funds" />
          ) : (
            <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
          )}
        </ModalHeader>
      )}

      {transactionsImportRow && (
        <TransactionsImportRowDetails transactionsImportRow={transactionsImportRow} className="mb-4" />
      )}

      {!LoggedInUser ? (
        <MessageBox type="error" withIcon>
          <FormattedMessage defaultMessage="You need to be logged in to add funds" id="J37Qbv" />
        </MessageBox>
      ) : require2FAForAdmins(host) && !LoggedInUser.hasTwoFactorAuth ? (
        <TwoFactorAuthRequiredMessage borderWidth={0} noTitle />
      ) : hasConfirmedCollective ? (
        <AddFundsModalContentWithCollective
          collective={selectedCollective}
          fundDetails={fundDetails}
          setFundDetails={setFundDetails}
          handleClose={handleClose}
          initialValues={initialValues}
          onSelectOtherAccount={!collective && (() => setHasConfirmedCollective(false))}
          onSuccess={onSuccess}
          {...props}
        />
      ) : !host ? (
        <MessageBox type="error" withIcon>
          <FormattedMessage defaultMessage="Host is required for adding funds" id="EGiXCI" />
        </MessageBox>
      ) : (
        <div>
          <label htmlFor="add-funds-collective-picker" className="mt-2 text-base font-bold">
            <FormattedMessage defaultMessage="Select an account to add funds to:" id="addFunds.selectCollective" />
          </label>
          {collective ? (
            <CollectivePicker
              inputId="add-funds-collective-picker"
              collectives={collective}
              collective={selectedCollective}
              mt={2}
              onChange={({ value }) => {
                setSelectedCollective(value);
              }}
            />
          ) : (
            <CollectivePickerAsync
              inputId="add-funds-collective-picker"
              customOptions={[
                {
                  label: intl.formatMessage({ defaultMessage: 'Fiscal Host', id: 'Fiscalhost' }),
                  options: [{ value: host, label: <DefaultCollectiveLabel value={host} /> }],
                },
              ]}
              mt={2}
              hostCollectiveIds={getLegacyIdForCollective(host)}
              types={['COLLECTIVE', 'PROJECT', 'EVENT', 'FUND']}
              getDefaultOptions={buildOption => buildOption(selectedCollective)}
              onChange={({ value }) => {
                setSelectedCollective(value);
              }}
            />
          )}
          <div className="mt-8 flex justify-between gap-4">
            <Button onClick={handleClose} variant="outline" type="button">
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </Button>
            <Button onClick={() => setHasConfirmedCollective(true)} disabled={!selectedCollective}>
              <FormattedMessage defaultMessage="Continue" id="actions.continue" />
            </Button>
          </div>
        </div>
      )}
    </AddFundsModalContainer>
  );
};

export default AddFundsModal;

type AddFundsFormSectionProps = React.PropsWithChildren & {
  title: string | React.ReactNode;
};

function AddFundsFormSection({ title, children }: AddFundsFormSectionProps) {
  return (
    <div className="rounded-lg">
      <div className="mb-3 flex items-center gap-3">
        <p className="leading-[17px] font-bold whitespace-nowrap text-[#0F1729]">{title}</p>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
