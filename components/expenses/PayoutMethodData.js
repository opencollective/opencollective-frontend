import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get, startCase, upperCase } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';

import Container from '../Container';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LoadingPlaceholder from '../LoadingPlaceholder';

const renderObject = object =>
  Object.entries(object).reduce((acc, [key, value]) => {
    if (typeof value === 'object') {
      return [...acc, ...renderObject(value)];
    }
    return [
      ...acc,
      <p className="text-ellipsis text-sm leading-5" key={key}>
        <FormattedMessage id="withColon" defaultMessage="{item}:" values={{ item: startCase(key) }} /> {value}
      </p>,
    ];
  }, []);

const PRIVATE_DATA_PLACEHOLDER = '********';

const getPmData = (payoutMethod, field, isLoading) => {
  if (isLoading) {
    return <LoadingPlaceholder height={15} />;
  } else {
    return get(payoutMethod, `data.${field}`, PRIVATE_DATA_PLACEHOLDER);
  }
};

/**
 * Shows the data of the given payout method
 */
const PayoutMethodData = ({ payoutMethod, showLabel, isLoading }) => {
  if (isLoading && !payoutMethod) {
    return <LoadingPlaceholder height={24} mb={2} />;
  } else if (!payoutMethod) {
    return null;
  }

  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL:
      return (
        <div>
          {showLabel && (
            <Container fontSize="14px" fontWeight="700" mb={2}>
              <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" />
              &nbsp;&nbsp;
              <PrivateInfoIcon />
            </Container>
          )}
          <div className="overflow-hidden text-ellipsis text-sm text-slate-700">
            {getPmData(payoutMethod, 'email', isLoading)}
          </div>
        </div>
      );
    case PayoutMethodType.OTHER:
      return (
        <div>
          {showLabel && (
            <Container fontSize="14px" fontWeight="700" mb={2}>
              <FormattedMessage id="Details" defaultMessage="Details" />
              &nbsp;&nbsp;
              <PrivateInfoIcon />
            </Container>
          )}
          <Container fontSize="14px" color="black.700">
            {getPmData(payoutMethod, 'content', isLoading)}
          </Container>
        </div>
      );
    case PayoutMethodType.BANK_ACCOUNT:
      return (
        <div>
          {showLabel && (
            <Container fontSize="14px" fontWeight="700" mb={2}>
              <FormattedMessage id="Details" defaultMessage="Details" />
              &nbsp;&nbsp;
              <PrivateInfoIcon />
            </Container>
          )}
          {payoutMethod.data ? (
            <Container fontSize="14px" color="black.700">
              <FormattedMessage
                id="BankInfo.Type"
                defaultMessage="Type: {type}"
                values={{ type: upperCase(payoutMethod.data.type) }}
              />
              {payoutMethod.data.accountHolderName && (
                <Fragment>
                  <br />
                  <FormattedMessage
                    id="BankInfo.AccountHolder"
                    defaultMessage="Account Holder: {name}"
                    values={{ name: payoutMethod.data.accountHolderName }}
                  />
                </Fragment>
              )}
              {payoutMethod.data.details && renderObject(payoutMethod.data.details)}
            </Container>
          ) : isLoading ? (
            <LoadingPlaceholder height="1.5em" />
          ) : (
            PRIVATE_DATA_PLACEHOLDER
          )}
        </div>
      );
    default:
      return null;
  }
};

PayoutMethodData.propTypes = {
  /** If false, only the raw data will be displayed */
  showLabel: PropTypes.bool,
  isLoading: PropTypes.bool,
  payoutMethod: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.oneOf(Object.values(PayoutMethodType)),
    data: PropTypes.object,
  }),
};

PayoutMethodData.defaultProps = {
  showLabel: true,
};

// @component
export default PayoutMethodData;
