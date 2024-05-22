import React from 'react';
import { SiOpencollective, SiPaypal, SiStripe, SiWise } from '@icons-pack/react-simple-icons';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { PaymentMethodService, PaymentMethodType } from '../lib/graphql/types/v2/graphql';
import { i18nPaymentMethodService } from '../lib/i18n/payment-method-service';
import { i18nPaymentMethodType } from '../lib/i18n/payment-method-type';

export function PaymentMethodLabel(props: { service?: PaymentMethodService; type?: PaymentMethodType }) {
  const intl = useIntl();
  return (
    <span className="flex items-center gap-1">
      <PaymentMethodServiceLabel service={props.service} />
      {props.type && <React.Fragment>({i18nPaymentMethodType(intl, props.type)})</React.Fragment>}
    </span>
  );
}

const ServiceIcon = ({ service, ...props }: { service: PaymentMethodService; size: number }) => {
  const iconContainerClasses = 'size-5 flex items-center justify-center rounded';
  switch (service) {
    case PaymentMethodService.PAYPAL:
      return (
        <div className={clsx(iconContainerClasses, 'bg-[#003087]')}>
          <SiPaypal {...props} color="white" />
        </div>
      );
    case PaymentMethodService.OPENCOLLECTIVE:
      return (
        <div className={clsx(iconContainerClasses, 'bg-white')}>
          <SiOpencollective {...props} color="#7FADF2" />
        </div>
      );
    case PaymentMethodService.STRIPE:
      return (
        <div className={clsx(iconContainerClasses, 'bg-[#635bff]')}>
          <SiStripe {...props} color="white" />
        </div>
      );
    case PaymentMethodService.WISE:
      return (
        <div className={clsx(iconContainerClasses, 'bg-[#87ea5c]')}>
          <SiWise {...props} color="#073400" />
        </div>
      );
    case PaymentMethodService.THEGIVINGBLOCK:
    default:
      return null;
  }
};

export function PaymentMethodServiceLabel(props: { service?: PaymentMethodService }) {
  const intl = useIntl();
  if (!props.service) {
    return null;
  }
  return (
    <span className="flex items-center gap-2">
      <ServiceIcon size={14} service={props.service} />
      {i18nPaymentMethodService(intl, props.service)}
    </span>
  );
}
