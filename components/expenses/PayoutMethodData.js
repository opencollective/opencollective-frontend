import React, { Fragment } from 'react';
import { get, startCase, upperCase } from 'lodash';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';

import Container from '../Container';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LoadingPlaceholder from '../LoadingPlaceholder';

/** Number of days after which a PayPal verification is considered stale for display purposes */
const PAYPAL_VERIFICATION_STALE_DAYS = 90;

const isPaypalVerificationStale = verifiedAt => {
  if (!verifiedAt) {
    return false;
  }
  const ageInDays = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays > PAYPAL_VERIFICATION_STALE_DAYS;
};

const renderObject = object =>
  Object.entries(object).reduce((acc, [key, value]) => {
    if (typeof value === 'object') {
      return [...acc, ...renderObject(value)];
    }
    return [
      ...acc,
      <p className="text-sm leading-5 text-ellipsis" key={key}>
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
const PayoutMethodData = ({ payoutMethod, showLabel = true, isLoading = false }) => {
  if (isLoading && !payoutMethod) {
    return <LoadingPlaceholder height={24} mb={2} />;
  } else if (!payoutMethod) {
    return null;
  }

  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL: {
      const paypalInfo = payoutMethod.paypalInfo;
      const isVerified = payoutMethod.isVerified;
      const verifiedAt = paypalInfo?.verifiedAt;
      const isStale = isPaypalVerificationStale(verifiedAt);
      return (
        <div>
          {showLabel && (
            <Container fontSize="14px" fontWeight="700" mb={2}>
              <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" />
              &nbsp;&nbsp;
              <PrivateInfoIcon />
            </Container>
          )}
          <div className="overflow-hidden text-sm text-ellipsis text-slate-700">
            {getPmData(payoutMethod, 'email', isLoading)}
          </div>

          {/* Verification status — shown when paypalInfo is available (host admins / permission holders) */}
          {isLoading ? null : isVerified === true ? (
            <div className={`mt-1 flex items-center gap-1 text-xs ${isStale ? 'text-yellow-700' : 'text-green-700'}`}>
              {isStale ? <ShieldAlert size={12} /> : <BadgeCheck size={12} />}
              {verifiedAt ? (
                isStale ? (
                  <FormattedMessage
                    defaultMessage="PayPal account verified on {date} (stale — consider asking payee to reconnect)"
                    id="PayPal.VerifiedStale"
                    values={{ date: new Date(verifiedAt).toLocaleDateString() }}
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="PayPal account verified on {date}"
                    id="PayPal.VerifiedOn"
                    values={{ date: new Date(verifiedAt).toLocaleDateString() }}
                  />
                )
              ) : (
                <FormattedMessage defaultMessage="PayPal account verified" id="PayPal.Verified" />
              )}
              {paypalInfo?.name && paypalInfo.name !== getPmData(payoutMethod, 'email', false) && (
                <span className="ml-1 text-muted-foreground">({paypalInfo.name})</span>
              )}
            </div>
          ) : isVerified === false ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-yellow-700">
              <ShieldAlert size={12} />
              <FormattedMessage defaultMessage="PayPal account not verified via OAuth" id="PayPal.NotVerifiedOAuth" />
            </div>
          ) : null}
        </div>
      );
    }
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
          <Container className="overflow-hidden text-ellipsis" fontSize="14px" color="black.700">
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

// @component
export default PayoutMethodData;
