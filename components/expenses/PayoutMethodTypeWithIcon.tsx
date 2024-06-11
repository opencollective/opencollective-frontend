import React from 'react';
import { Paypal as PaypalIcon } from '@styled-icons/fa-brands/Paypal';
import { CreditCard } from '@styled-icons/fa-solid/CreditCard';
import { ExchangeAlt as OtherIcon } from '@styled-icons/fa-solid/ExchangeAlt';
import { University as BankIcon } from '@styled-icons/fa-solid/University';
import { FormattedMessage } from 'react-intl';

import { INVITE, PayoutMethodType, VIRTUAL_CARD } from '../../lib/constants/payout-method';

import Avatar from '../Avatar';
import { Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { Span } from '../Text';

interface PayoutMethodTypeWithIconProps {
  isLoading?: boolean;
  type?: unknown | unknown;
  fontSize?: string | number;
  fontWeight?: string;
  color?: string;
  iconSize?: string | number;
  name?: string;
}

/**
 * Shows the data of the given payout method
 */
const PayoutMethodTypeWithIcon = ({
  isLoading = false,
  type,
  fontSize = '13px',
  fontWeight = 'bold',
  color = 'black.900',
  iconSize = 24,
  name,
}: PayoutMethodTypeWithIconProps) => {
  if (isLoading) {
    return <LoadingPlaceholder height={15} width={90} />;
  }

  switch (type) {
    case PayoutMethodType.PAYPAL:
      return (
        <Flex alignItems="center">
          <PaypalIcon size={iconSize} color="#192f86" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            PayPal
          </Span>
        </Flex>
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return (
        <Flex alignItems="center">
          <BankIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="BankAccount" defaultMessage="Bank account" />
          </Span>
        </Flex>
      );
    case PayoutMethodType.ACCOUNT_BALANCE:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            Open Collective
          </Span>
        </Flex>
      );
    case INVITE:
      return (
        <Flex alignItems="center">
          <Avatar name="?" size={iconSize} backgroundColor="blue.100" color="blue.400" fontWeight="500" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="PayoutMethod.Type.ToBeDefined" defaultMessage="Not yet set" />
          </Span>
        </Flex>
      );
    case VIRTUAL_CARD:
      return (
        <Flex alignItems="center">
          <CreditCard size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            {name || <FormattedMessage id="PayoutMethod.Type.VirtualCard" defaultMessage="Virtual Card" />}
          </Span>
        </Flex>
      );
    case PayoutMethodType.OTHER:
    default:
      return (
        <Flex alignItems="center">
          <OtherIcon size={iconSize} color="#9D9FA3" />
          <Span ml={2} fontWeight={fontWeight} fontSize={fontSize} color={color}>
            <FormattedMessage id="PayoutMethod.Type.Other" defaultMessage="Other" />
          </Span>
        </Flex>
      );
  }
};

// @component
export default PayoutMethodTypeWithIcon;
