import React from 'react';
import { Paypal } from '@styled-icons/fa-brands/Paypal';
import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { Landmark } from 'lucide-react';

import type { PayoutMethod } from '../lib/graphql/types/v2/graphql';
import { PayoutMethodType } from '../lib/graphql/types/v2/graphql';

import Image from './Image';

export function PayoutMethodIcon(props: { payoutMethod: Omit<PayoutMethod, 'id'>; size?: number }) {
  const size = props.size || 16;
  switch (props.payoutMethod.type) {
    case PayoutMethodType.ACCOUNT_BALANCE:
      return (
        <Image
          className="inline-block self-center"
          alt="Open Collective"
          src="/static/images/oc-logo-watercolor-256.png"
          height={size}
          width={size}
        />
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return <Landmark className="inline-block self-center" size={size} />;
    case PayoutMethodType.OTHER:
      return <MoneyCheck className="inline-block self-center" size={size} />;
    case PayoutMethodType.PAYPAL:
      return <Paypal className="inline-block self-center" size={size} />;
  }
}
