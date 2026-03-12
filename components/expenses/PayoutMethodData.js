import React, { Fragment } from 'react';
import { get, startCase, upperCase } from 'lodash';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { PayoutMethodType } from '../../lib/constants/payout-method';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';

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
  const intl = useIntl();
  if (isLoading && !payoutMethod) {
    return <LoadingPlaceholder height={24} mb={2} />;
  } else if (!payoutMethod) {
    return null;
  }

  switch (payoutMethod.type) {
    case PayoutMethodType.PAYPAL: {
      const isVerified = payoutMethod.isVerified;
      const verifiedAt = payoutMethod.data?.verifiedAt;
      return (
        <div>
          {/* Verification status — shown when paypalInfo is available (host admins / permission holders) */}
          {isLoading ? null : isVerified ? (
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
          ) : (
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
          )}

          {showLabel && (
            <Container fontSize="14px" fontWeight="700" mb={2}>
              <FormattedMessage defaultMessage="Account details" id="utJA9s" />
              &nbsp;&nbsp;
              <PrivateInfoIcon />
            </Container>
          )}

          <div className="flex flex-col gap-1">
            <div className="overflow-hidden text-sm text-ellipsis text-slate-700">
              <div className="text-xs font-medium text-slate-700">
                <FormattedMessage
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{ item: <FormattedMessage id="Email" defaultMessage="Email" /> }}
                />
              </div>
              <div className="text-xs text-slate-700">{getPmData(payoutMethod, 'email', isLoading)}</div>
            </div>

            {payoutMethod.data?.paypalUserInfo && (
              <React.Fragment>
                <div className="overflow-hidden text-sm text-ellipsis text-slate-700">
                  <div className="text-xs font-medium text-slate-700">
                    <FormattedMessage
                      id="withColon"
                      defaultMessage="{item}:"
                      values={{ item: <FormattedMessage id="Fields.name" defaultMessage="Name" /> }}
                    />
                  </div>
                  <div className="text-xs text-slate-700">{getPmData(payoutMethod, 'paypalUserInfo.name')}</div>
                </div>{' '}
                <div className="overflow-hidden text-sm text-ellipsis text-slate-700">
                  <div className="text-xs font-medium text-slate-700">
                    <FormattedMessage
                      id="withColon"
                      defaultMessage="{item}:"
                      values={{
                        item: (
                          <FormattedMessage defaultMessage="{service} ID" id="Az5g+0" values={{ service: 'PayPal' }} />
                        ),
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-700">{getPmData(payoutMethod, 'paypalUserInfo.payer_id')}</div>
                </div>
                <div className="overflow-hidden text-sm text-ellipsis text-slate-700">
                  <div className="text-xs font-medium text-slate-700">
                    <FormattedMessage
                      id="withColon"
                      defaultMessage="{item}:"
                      values={{ item: <FormattedMessage id="collective.country.label" defaultMessage="Country" /> }}
                    />
                  </div>
                  <div className="text-xs text-slate-700">
                    {!payoutMethod.data.paypalUserInfo.address?.country ? (
                      <i>
                        <FormattedMessage defaultMessage="Unknown" id="Unknown" />
                      </i>
                    ) : (
                      <Badge size="xs">
                        {getFlagEmoji(payoutMethod.data.paypalUserInfo.address.country)}
                        &nbsp;
                        {getCountryDisplayName(intl, payoutMethod.data.paypalUserInfo.address.country)}
                      </Badge>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )}
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
