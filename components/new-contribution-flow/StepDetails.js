import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { hostIsTaxDeductibeInTheUs } from '../../lib/collective.lib';
import INTERVALS from '../../lib/constants/intervals';
import { AmountTypes, TierTypes } from '../../lib/constants/tiers-types';
import { i18nInterval } from '../../lib/i18n/interval';
import { getTierMinAmount, getTierPresets } from '../../lib/tier-utils';
import { Router } from '../../server/pages';

import { Box } from '../../components/Grid';
import StyledButtonSet from '../../components/StyledButtonSet';
import StyledInputField from '../../components/StyledInputField';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledAmountPicker from '../StyledAmountPicker';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import { H5, P, Span } from '../Text';

import ChangeTierWarningModal from './ChangeTierWarningModal';
import FeesOnTopInput from './FeesOnTopInput';
import TierCustomFields from './TierCustomFields';
import { getTotalAmount } from './utils';

const StepDetails = ({ onChange, data, collective, tier, showFeesOnTop }) => {
  const intl = useIntl();
  const [temporaryInterval, setTemporaryInterval] = React.useState(undefined);
  const presets = React.useMemo(() => getTierPresets(tier, collective.type), [tier, collective.type]);
  const hasQuantity = tier?.type === TierTypes.TICKET || tier?.type === TierTypes.PRODUCT;
  const isFixedContribution = tier?.amountType === AmountTypes.FIXED;
  const dispatchChange = (field, value) => {
    onChange({ stepDetails: { ...data, [field]: value }, stepSummary: null });
  };

  return (
    <Box width={1}>
      {!isFixedContribution ? (
        <Box mb={3}>
          <StyledAmountPicker
            currency={collective.currency}
            presets={presets}
            min={getTierMinAmount(tier)}
            value={data?.amount}
            onChange={amount => dispatchChange('amount', amount)}
          />
        </Box>
      ) : tier.amount.valueInCents ? (
        <Box mb={3}>
          <FormattedMessage
            id="contribute.tierDetails"
            defaultMessage="You’ll contribute with the amount of {amount}{interval, select, month { monthly} year { yearly} other {}}."
            values={{
              interval: tier.interval,
              amount: <FormattedMoneyAmount amount={getTotalAmount(data)} currency={collective.currency} />,
            }}
          />
        </Box>
      ) : !hasQuantity ? (
        <FormattedMessage
          id="contribute.freeTier"
          defaultMessage="This is a free tier, you can submit your order directly."
        />
      ) : null}

      {hasQuantity && (
        <Box mb={3}>
          <StyledInputField
            htmlFor="quantity"
            label={<FormattedMessage id="contribution.quantity" defaultMessage="Quantity" />}
            labelFontSize="20px"
            labelColor="black.700"
            labelProps={{ fontWeight: 500, lineHeight: '28px', mb: 1 }}
            error={Boolean(tier.availableQuantity !== null && data?.quantity > tier.availableQuantity)}
            required
          >
            {fieldProps => (
              <div>
                {tier.availableQuantity !== null && (
                  <P
                    fontSize="11px"
                    color="#e69900"
                    textTransform="uppercase"
                    fontWeight="500"
                    letterSpacing="1px"
                    mb={2}
                  >
                    <FormattedMessage
                      id="tier.limited"
                      defaultMessage="LIMITED: {availableQuantity} LEFT OUT OF {maxQuantity}"
                      values={tier}
                    />
                  </P>
                )}
                <StyledInput
                  {...fieldProps}
                  type="number"
                  min={1}
                  step={1}
                  max={tier.availableQuantity}
                  value={data?.quantity}
                  maxWidth={80}
                  onChange={e => dispatchChange('quantity', parseInt(e.target.value))}
                  fontSize="20px"
                  lineHeight="26px"
                  minWidth={100}
                />
              </div>
            )}
          </StyledInputField>
        </Box>
      )}
      {(!tier || tier.amountType === AmountTypes.FLEXIBLE) && (
        <StyledInputField
          label={<FormattedMessage id="contribution.interval.label" defaultMessage="Frequency" />}
          htmlFor="interval"
          css={{ flexGrow: 1 }}
          labelFontSize="20px"
          labelColor="black.700"
          labelProps={{ fontWeight: 500, lineHeight: '28px', mb: 1 }}
          mb={3}
        >
          {fieldProps => (
            <StyledButtonSet
              {...fieldProps}
              justifyContent="center"
              mt={[4, 0]}
              items={[null, INTERVALS.month, INTERVALS.year]}
              selected={data?.interval || null}
              buttonProps={{ p: 2 }}
              onChange={interval => {
                if (tier) {
                  setTemporaryInterval(interval);
                } else {
                  dispatchChange('interval', interval);
                }
              }}
            >
              {({ item, isSelected }) => (
                <Span fontSize="18px" lineHeight="21px" fontWeight={isSelected ? 500 : 'normal'}>
                  {i18nInterval(intl, item || INTERVALS.oneTime)}
                </Span>
              )}
            </StyledButtonSet>
          )}
        </StyledInputField>
      )}
      {showFeesOnTop && (
        <Box mt={28}>
          <FeesOnTopInput
            currency={collective.currency}
            amount={data?.amount}
            fees={data?.platformContribution}
            interval={data?.interval}
            onChange={value => dispatchChange('platformContribution', value)}
          />
        </Box>
      )}
      {hostIsTaxDeductibeInTheUs(collective.host) && (
        <React.Fragment>
          <StyledHr borderColor="black.300" mb={2} mt={24} />
          <P fontSize="11px" lineHeight="16px" fontStyle="italic" color="black.600">
            <FormattedMessage
              id="platformFee.taxDeductible"
              defaultMessage="This Collective's Fiscal Host is a registered 501 c(3) non-profit organization. Your contribution will be tax-deductible to the extent allowed by the law."
            />
          </P>
        </React.Fragment>
      )}
      {tier?.customFields && (
        <Box mt={28}>
          <H5 fontSize="20px" fontWeight="normal" color="black.800">
            <FormattedMessage id="OtherInfo" defaultMessage="Other information" />
          </H5>
          <TierCustomFields
            fields={tier.customFields}
            data={data?.customFieldsData}
            onChange={customFieldsData => dispatchChange('customFieldsData', customFieldsData)}
          />
        </Box>
      )}
      {temporaryInterval !== undefined && (
        <ChangeTierWarningModal
          show
          tierName={tier.name}
          onClose={() => setTemporaryInterval(null)}
          onConfirm={() => {
            dispatchChange('interval', temporaryInterval);
            setTemporaryInterval(undefined);
            Router.pushRoute('orderCollectiveNew', {
              collectiveSlug: collective.slug,
              verb: 'donate',
              step: 'details',
            });
          }}
        />
      )}
    </Box>
  );
};

StepDetails.propTypes = {
  onChange: PropTypes.func,
  showFeesOnTop: PropTypes.bool,
  data: PropTypes.shape({
    amount: PropTypes.number,
    platformContribution: PropTypes.number,
    quantity: PropTypes.number,
    interval: PropTypes.string,
    customFieldsData: PropTypes.object,
  }),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    type: PropTypes.string,
    host: PropTypes.object,
  }).isRequired,
  tier: PropTypes.shape({
    amountType: PropTypes.string,
    interval: PropTypes.string,
    name: PropTypes.string,
    maxQuantity: PropTypes.number,
    availableQuantity: PropTypes.number,
    type: PropTypes.oneOf(Object.values(TierTypes)),
    customFields: PropTypes.array,
    amount: PropTypes.shape({
      valueInCents: PropTypes.number,
    }),
    minAmount: PropTypes.shape({
      valueInCents: PropTypes.number,
    }),
  }),
};

export default StepDetails;
