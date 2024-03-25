import React from 'react';
import { Paypal } from '@styled-icons/fa-brands/Paypal';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { Landmark } from 'lucide-react';

import { PayoutMethod, PayoutMethodType } from '../lib/graphql/types/v2/graphql';

import Image from './Image';

export function PayoutMethodIcon(props: { payoutMethod: Omit<PayoutMethod, 'id'> }) {
  switch (props.payoutMethod.type) {
    case PayoutMethodType.ACCOUNT_BALANCE:
      return (
        <Image
          className="inline-block"
          alt="Open Collective"
          src="/static/images/oc-logo-watercolor-256.png"
          height={16}
          width={16}
        />
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return <Landmark className="inline-block" size={16} />;
    case PayoutMethodType.OTHER:
      return <MoneyCheck className="inline-block" size={16} />;
    case PayoutMethodType.PAYPAL:
      return <Paypal className="inline-block" size={16} />;
  }
}
