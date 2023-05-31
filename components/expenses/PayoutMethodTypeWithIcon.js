import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
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

/**
 * Shows the data of the given payout method
 */
const PayoutMethodTypeWithIcon = ({ isLoading, type, fontSize, fontWeight, color, iconSize, onlyIcon, name }) => {
  if (isLoading) {
    return <LoadingPlaceholder height={15} width={90} />;
  }

  let icon, label;

  switch (type) {
    case PayoutMethodType.PAYPAL:
      icon = <PaypalIcon size={iconSize} color="#192f86" />;
      label = 'PayPal';
      break;

    case PayoutMethodType.BANK_ACCOUNT:
      icon = <BankIcon size={iconSize} color="#9D9FA3" />;
      label = <FormattedMessage id="BankAccount" defaultMessage="Bank account" />;
      break;
    case PayoutMethodType.ACCOUNT_BALANCE:
      icon = <OtherIcon size={iconSize} color="#9D9FA3" />;
      label = 'Open Collective';
      break;

    case INVITE:
      icon = <Avatar name="?" size={iconSize} backgroundColor="blue.100" color="blue.400" fontWeight="500" />;
      label = <FormattedMessage id="PayoutMethod.Type.ToBeDefined" defaultMessage="Not yet set" />;
      break;

    case VIRTUAL_CARD:
      icon = <CreditCard size={iconSize} color="#9D9FA3" />;
      label = name || <FormattedMessage id="PayoutMethod.Type.VirtualCard" defaultMessage="Virtual Card" />;
      break;

    case PayoutMethodType.OTHER:
    default:
      icon = <OtherIcon size={iconSize} color="#9D9FA3" />;
      label = <FormattedMessage id="PayoutMethod.Type.Other" defaultMessage="Other" />;
  }

  return (
    <div className="flex items-center gap-2 truncate">
      {icon}
      {!onlyIcon ? <span className="truncate text-xs">{label}</span> : null}
    </div>
  );
};

PayoutMethodTypeWithIcon.propTypes = {
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf([...Object.values(PayoutMethodType), INVITE]),
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fontWeight: PropTypes.string,
  color: PropTypes.string,
  iconSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  onlyIcon: PropTypes.bool,
};

PayoutMethodTypeWithIcon.defaultProps = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'black.900',
  iconSize: 24,
};

// @component
export default PayoutMethodTypeWithIcon;
