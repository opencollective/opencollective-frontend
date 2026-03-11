import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { PaymentMethodService, PaymentMethodType } from '../../../lib/graphql/types/v2/graphql';
import { i18nPaymentMethodService } from '../../../lib/i18n/payment-method-service';
import { i18nPaymentMethodType } from '../../../lib/i18n/payment-method-type';

import { PaymentMethodLabel, PaymentMethodServiceLabel } from '../../PaymentMethodLabel';
import { Checkbox } from '../../ui/Checkbox';
import { Label } from '../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';

const manualPaymentProviderIdsSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform(val => {
    if (val === undefined || val === null) {
      return undefined;
    }
    if (Array.isArray(val)) {
      return val;
    }
    if (typeof val === 'string') {
      return val === ''
        ? []
        : val
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }
    return undefined;
  });

const schema = z
  .object({
    service: z.nativeEnum(PaymentMethodService),
    type: z.nativeEnum(PaymentMethodType).optional(),
    manualPaymentProviderIds: manualPaymentProviderIdsSchema,
  })
  .optional();
type PaymentMethodFilterValue = z.infer<typeof schema>;

const options: Partial<Record<PaymentMethodService, PaymentMethodType[]>> = {
  [PaymentMethodService.OPENCOLLECTIVE]: [
    PaymentMethodType.COLLECTIVE,
    PaymentMethodType.GIFTCARD,
    PaymentMethodType.HOST,
    PaymentMethodType.MANUAL,
    PaymentMethodType.PREPAID,
  ],
  [PaymentMethodService.PAYPAL]: [
    PaymentMethodType.ADAPTIVE,
    PaymentMethodType.MANUAL,
    PaymentMethodType.PAYMENT,
    PaymentMethodType.PAYOUT,
    PaymentMethodType.SUBSCRIPTION,
  ],
  [PaymentMethodService.STRIPE]: [
    PaymentMethodType.BACS_DEBIT,
    PaymentMethodType.BANCONTACT,
    PaymentMethodType.CREDITCARD,
    PaymentMethodType.LINK,
    PaymentMethodType.SEPA_DEBIT,
    PaymentMethodType.US_BANK_ACCOUNT,
    PaymentMethodType.VIRTUAL_CARD,
  ],
  [PaymentMethodService.WISE]: [PaymentMethodType.BANK_TRANSFER, PaymentMethodType.MANUAL],
  [PaymentMethodService.THEGIVINGBLOCK]: [PaymentMethodType.CRYPTO],
};

export const paymentMethodFilter: FilterConfig<PaymentMethodFilterValue> = {
  schema,
  toVariables: value => {
    const base = {
      paymentMethodService: value?.service,
      paymentMethodType: value?.type,
    };
    if (value?.manualPaymentProviderIds?.length) {
      return { ...base, manualPaymentProvider: value.manualPaymentProviderIds.map(id => ({ id })) };
    }
    return base;
  },
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Payment method', id: 'Fields.paymentMethod' }),
    valueRenderer: PaymentMethodRenderer,
    Component: PaymentMethodFilter,
  },
};

function PaymentMethodRenderer({ value, meta }) {
  const { manualPaymentProviders } = useManualPaymentProviders(meta.accountSlug);

  if (value?.manualPaymentProviderIds?.length && manualPaymentProviders?.length) {
    const names = value.manualPaymentProviderIds
      .map(id => manualPaymentProviders.find(p => p.id === id)?.name)
      .filter(Boolean);
    if (names.length) {
      const allNamesStr = names.join(', ');
      return (
        <div className="flex max-w-[248px] gap-1 truncate">
          <FormattedMessage id="PaymentMethod.Manual" defaultMessage="Manual" /> &gt;{' '}
          <span title={allNamesStr} className="truncate text-muted-foreground">
            {allNamesStr}
          </span>
        </div>
      );
    }
  } else {
    return <PaymentMethodLabel {...value} />;
  }
}

export type PaymentMethodFilterMeta = {
  accountSlug?: string;
  paymentMethodTypes?: PaymentMethodType[];
};

const manualPaymentProvidersQuery = gql`
  query ManualPaymentProviders($accountSlug: String) {
    account(slug: $accountSlug) {
      id
      ... on AccountWithHost {
        host {
          id
          manualPaymentProviders {
            id
            name
          }
        }
      }
      ... on Organization {
        host {
          id
          manualPaymentProviders {
            id
            name
          }
        }
      }
      ... on Host {
        manualPaymentProviders {
          id
          name
        }
      }
    }
  }
`;

function useManualPaymentProviders(accountSlug: string) {
  const { data, loading } = useQuery(manualPaymentProvidersQuery, { variables: { accountSlug } });
  const manualPaymentProviders =
    data?.account.manualPaymentProviders ?? data?.account.host?.manualPaymentProviders ?? undefined;
  return { manualPaymentProviders, loading };
}

function PaymentMethodFilter({
  value,
  intl,
  onChange,
  meta,
}: FilterComponentProps<z.infer<typeof schema>, PaymentMethodFilterMeta>) {
  const { manualPaymentProviders } = useManualPaymentProviders(meta.accountSlug);

  let filteredOptions = options;
  if (meta.paymentMethodTypes) {
    // Filter `options` based on `meta.paymentMethodTypes`; always include MANUAL for OPENCOLLECTIVE when host has custom providers
    filteredOptions = Object.keys(options).reduce((acc, key) => {
      const typesForService = options[key].filter(type => meta.paymentMethodTypes.includes(type));
      if (typesForService.length > 0) {
        acc[key] = typesForService;
      }
      return acc;
    }, {});
    if (manualPaymentProviders?.length && filteredOptions[PaymentMethodService.OPENCOLLECTIVE]) {
      const ocTypes = filteredOptions[PaymentMethodService.OPENCOLLECTIVE];
      if (!ocTypes.includes(PaymentMethodType.MANUAL)) {
        filteredOptions = {
          ...filteredOptions,
          [PaymentMethodService.OPENCOLLECTIVE]: [...ocTypes, PaymentMethodType.MANUAL],
        };
      }
    }
  }

  const serviceOptions = React.useMemo(
    () =>
      Object.keys(filteredOptions).map(value => {
        const label = i18nPaymentMethodService(intl, value);
        return {
          label,
          value: String(value),
        };
      }),
    [intl, filteredOptions],
  );

  const typeOptions = (filteredOptions[value?.service] || []).map(value => ({
    label: i18nPaymentMethodType(intl, value),
    value: value,
  }));

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-1">
        <Label>
          <FormattedMessage defaultMessage="Service" id="n7yYXG" />
        </Label>
        <Select
          value={value?.service}
          onValueChange={(service: PaymentMethodService) =>
            onChange({
              service,
              ...(service !== PaymentMethodService.OPENCOLLECTIVE && { manualPaymentProviderIds: undefined }),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={intl.formatMessage({ defaultMessage: 'Select service', id: 'ASC3C8' })} />
          </SelectTrigger>
          <SelectContent>
            {serviceOptions.map(option => (
              <SelectItem key={option.value} value={option.value} asChild>
                <PaymentMethodServiceLabel service={option.value as PaymentMethodService} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value?.service && (
        <div className="space-y-1">
          <Label>
            <FormattedMessage defaultMessage="Type" id="+U6ozc" />
          </Label>
          <Select
            value={value?.type || 'ALL'}
            onValueChange={(type: PaymentMethodType | 'ALL') =>
              onChange({
                service: value.service,
                ...(type !== 'ALL' && { type }),
                ...(type !== PaymentMethodType.MANUAL && { manualPaymentProviderIds: undefined }),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={'ALL'}>
                <FormattedMessage defaultMessage="All" id="zQvVDJ" />
              </SelectItem>
              {typeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value?.service === PaymentMethodService.OPENCOLLECTIVE &&
        value?.type === PaymentMethodType.MANUAL &&
        manualPaymentProviders?.length > 0 && (
          <div className="space-y-2">
            <Label>
              <FormattedMessage defaultMessage="Manual Payments" id="editCollective.receivingMoney.manualPayments" />
            </Label>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={!value?.manualPaymentProviderIds?.length}
                  onCheckedChange={checked => {
                    if (checked) {
                      onChange({ ...value, manualPaymentProviderIds: undefined });
                    }
                  }}
                />
                <span className="text-sm">
                  <FormattedMessage defaultMessage="All" id="zQvVDJ" />
                </span>
              </label>
              {manualPaymentProviders.map(p => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={value?.manualPaymentProviderIds?.includes(p.id) ?? false}
                    onCheckedChange={checked => {
                      const current = value?.manualPaymentProviderIds ?? [];
                      const next = checked ? [...current, p.id] : current.filter(id => id !== p.id);
                      onChange({
                        ...value,
                        manualPaymentProviderIds: next.length ? next : undefined,
                      });
                    }}
                  />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
