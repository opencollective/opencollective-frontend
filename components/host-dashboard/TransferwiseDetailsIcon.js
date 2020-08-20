import React from 'react';
import PropTypes from 'prop-types';
import { Info } from '@styled-icons/feather/Info';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledTooltip from '../StyledTooltip';

const BalancesBreakdown = ({ balances }) => {
  return (
    <div>
      {balances.map(({ valueInCents, currency }) => (
        <React.Fragment key={currency}>
          {currency}:&nbsp;
          <FormattedMoneyAmount
            amount={valueInCents}
            currency={currency}
            amountStyles={{ color: '#FFFFFF', fontWeight: 'bold' }}
            showCurrencyCode={false}
          />
          <br />
        </React.Fragment>
      ))}
    </div>
  );
};

BalancesBreakdown.propTypes = {
  balances: PropTypes.arrayOf(
    PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
  ),
};

const TransferwiseDetailsIcon = ({ size, balances }) => {
  if (!balances || balances.length < 2) {
    return null;
  } else {
    return (
      <StyledTooltip content={() => <BalancesBreakdown balances={balances} />}>
        <Info size={size} color="#76777A" />
      </StyledTooltip>
    );
  }
};

TransferwiseDetailsIcon.propTypes = {
  size: PropTypes.number,
  balances: PropTypes.array,
};

export default TransferwiseDetailsIcon;
