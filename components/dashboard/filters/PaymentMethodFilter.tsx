import React from 'react';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';
import { PaymentMethodService, PaymentMethodType } from '../../../lib/graphql/types/v2/graphql';
import { i18nPaymentMethodService } from '../../../lib/i18n/payment-method-service';
import { i18nPaymentMethodType } from '../../../lib/i18n/payment-method-type';

import { Label } from '../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';

const schema = z
  .object({ service: z.nativeEnum(PaymentMethodService), type: z.nativeEnum(PaymentMethodType).optional() })
  .optional();

type PaymentMethodFilterValue = z.infer<typeof schema>;

const options: Partial<Record<PaymentMethodService, PaymentMethodType[]>> = {
  [PaymentMethodService.OPENCOLLECTIVE]: [
    PaymentMethodType.COLLECTIVE,
    PaymentMethodType.GIFTCARD,
    PaymentMethodType.HOST,
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
    return {
      paymentMethodService: value.service,
      paymentMethodType: value.type,
    };
  },
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Payment method', id: 'Fields.paymentMethod' }),
    valueRenderer: ({ value, intl }) => {
      const serviceLabel = i18nPaymentMethodService(intl, value.service);
      if (value.type) {
        return `${intl.formatMessage({ id: 'withColon', defaultMessage: '{item}:' }, { item: serviceLabel })} ${i18nPaymentMethodType(intl, value.type)}`;
      }
      return serviceLabel;
    },
    Component: ({ value, intl, onChange, meta }) => {
      let filteredOptions = options;
      if (meta.paymentMethodTypes) {
        // Filter `options` based on `meta.paymentMethodTypes`
        filteredOptions = Object.keys(options).reduce((acc, key) => {
          const typesForService = options[key].filter(type => meta.paymentMethodTypes.includes(type));
          if (typesForService.length > 0) {
            acc[key] = typesForService;
          }
          return acc;
        }, {});
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
            <Select value={value?.service} onValueChange={(service: PaymentMethodService) => onChange({ service })}>
              <SelectTrigger>
                <SelectValue placeholder={intl.formatMessage({ defaultMessage: 'Select service', id: 'ASC3C8' })} />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                  onChange({ service: value.service, ...(type !== 'ALL' && { type }) })
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
        </div>
      );
    },
  },
};
