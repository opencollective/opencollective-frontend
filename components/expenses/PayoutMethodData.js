import React, { Fragment } from 'react';
import { get, startCase, upperCase } from 'lodash';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';

import Container from '../Container';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { Badge } from '../ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

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
      return (
        <div>
          {/* Verification status — shown when paypalInfo is available (host admins / permission holders) */}
          {isLoading ? null : isVerified === true ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge type="success" size="xs" className="mb-2 cursor-help px-2">
                  <BadgeCheck size={12} />
                  {verifiedAt ? (
                    <FormattedMessage
                      defaultMessage="Verified on {date}"
                      id="FJwSTB"
                      values={{ date: <FormattedDate value={verifiedAt} dateStyle="short" /> }}
                    />
                  ) : (
                    <FormattedMessage defaultMessage="Verified" id="Z8971h" values={{ service: 'PayPal' }} />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs font-normal">
                <FormattedMessage
                  defaultMessage="This user connected their PayPal account, confirming ownership of this email address."
                  id="PayoutMethod.PayPal.VerifiedTooltip"
                />
              </TooltipContent>
            </Tooltip>
          ) : isVerified === false ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge type="warning" size="xs" className="mb-2 cursor-help">
                  <ShieldAlert size={12} />
                  <FormattedMessage defaultMessage="Unverified account" id="VlBhuE" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs font-normal">
                <FormattedMessage
                  defaultMessage="This email was provided by the user and has not been verified through PayPal."
                  id="PayoutMethod.PayPal.UnverifiedTooltip"
                />
              </TooltipContent>
            </Tooltip>
          ) : null}

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
