import React from 'react';
import PropTypes from 'prop-types';
import { Calendar } from '@styled-icons/feather/Calendar';
import { isNil } from 'lodash';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { hostIsTaxDeductibeInTheUs } from '../../lib/collective.lib';
import INTERVALS from '../../lib/constants/intervals';
import { AmountTypes, TierTypes } from '../../lib/constants/tiers-types';
import { formatCurrency } from '../../lib/currency-utils';
import { getNextChargeDate } from '../../lib/date-utils';
import { i18nInterval } from '../../lib/i18n/interval';
import { getTierMinAmount, getTierPresets } from '../../lib/tier-utils';
import { Router } from '../../server/pages';

import { Box, Flex } from '../../components/Grid';
import StyledButtonSet from '../../components/StyledButtonSet';
import StyledInputAmount from '../../components/StyledInputAmount';
import StyledInputField from '../../components/StyledInputField';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledAmountPicker, { OTHER_AMOUNT_KEY } from '../StyledAmountPicker';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import { H5, P, Span } from '../Text';

import ChangeTierWarningModal from './ChangeTierWarningModal';
import FeesOnTopInput from './FeesOnTopInput';
import TierCustomFields from './TierCustomFields';
import { getTotalAmount } from './utils';

const StepDetails = ({ onChange, data, collective, tier, showFeesOnTop }) => {
  const intl = useIntl();
  const amount = data?.amount;
  const checkDefaultAmount = () => !isNil(amount) && !presets?.includes(amount);
  const [temporaryInterval, setTemporaryInterval] = React.useState(undefined);
  const [isOtherAmountSelected, setOtherAmountSelected] = React.useState(checkDefaultAmount);
  const presets = React.useMemo(() => getTierPresets(tier, collective.type), [tier, collective.type]);
  const minAmount = getTierMinAmount(tier);
  const hasQuantity = tier?.type === TierTypes.TICKET || tier?.type === TierTypes.PRODUCT;
  const isFixedContribution = tier?.amountType === AmountTypes.FIXED;
  const dispatchChange = (field, value) => {
    onChange({ stepDetails: { ...data, [field]: value }, stepSummary: null });
  };

  return (
    <Box width={1}>
      {(!tier || tier.amountType === AmountTypes.FLEXIBLE) && (
        <StyledButtonSet
          id="interval"
          justifyContent="center"
          mt={[4, 0]}
          mb={3}
          items={[null, INTERVALS.month, INTERVALS.year]}
          selected={data?.interval || null}
          buttonProps={{ px: 2, py: '5px' }}
          onChange={interval => {
            if (tier) {
              setTemporaryInterval(interval);
            } else {
              dispatchChange('interval', interval);
            }
          }}
        >
          {({ item, isSelected }) => (
            <Span fontSize={isSelected ? '20px' : '18px'} lineHeight="28px" fontWeight={isSelected ? 500 : 400}>
              {i18nInterval(intl, item || INTERVALS.oneTime)}
            </Span>
          )}
        </StyledButtonSet>
      )}

      {!isFixedContribution ? (
        <Box mb={3}>
          <StyledAmountPicker
            currency={collective.currency}
            presets={presets}
            otherAmountDisplay="button"
            value={isOtherAmountSelected ? OTHER_AMOUNT_KEY : data?.amount}
            onChange={value => {
              if (value === OTHER_AMOUNT_KEY) {
                setOtherAmountSelected(true);
              } else {
                setOtherAmountSelected(false);
                dispatchChange('amount', value);
              }
            }}
          />
          {isOtherAmountSelected && (
            <Flex justifyContent="space-between" alignItems="center" mt={2}>
              <StyledInputAmount
                name="custom-amount"
                type="number"
                currency={collective.currency}
                value={data?.amount || null}
                placeholder="---"
                width={1}
                min={minAmount}
                currencyDisplay="full"
                prependProps={{ color: 'black.500' }}
                required
                onChange={value => {
                  dispatchChange('amount', value);
                }}
              />
              {Boolean(minAmount) && (
                <Flex fontSize="14px" color="black.800" flexDirection="column" alignItems="flex-end" mt={1}>
                  <FormattedMessage
                    id="contribution.minimumAmount"
                    defaultMessage="The minimum amount is: {minAmount} {currency}"
                    values={{
                      minAmount: formatCurrency(minAmount, collective.currency),
                      currency: collective.currency,
                    }}
                  />
                </Flex>
              )}
            </Flex>
          )}
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
      {data.interval && (
        <Flex width="100%" justifyContent="flex-end" mt={3}>
          <Flex bg="#F7F8FA" p="2px 8px">
            <Flex alignItems="center" mr={3}>
              <Calendar size={16} color="#9D9FA3" />
            </Flex>
            <Container color="black.500">
              <P fontSize="12px" lineHeight="18px" mb="4px">
                <Span>
                  <FormattedMessage id="contribution.subscription.first.label" defaultMessage="First charge:" />
                </Span>{' '}
                <Span color="primary.500" fontWeight="500">
                  <FormattedMessage id="contribution.subscription.today" defaultMessage="Today" />
                </Span>
              </P>
              <P fontSize="12px" lineHeight="18px">
                <FormattedMessage id="contribution.subscription.next.label" defaultMessage="Next charge:" />{' '}
                <Span color="primary.500" fontWeight="500">
                  <FormattedDate
                    value={getNextChargeDate(new Date(), data.interval)}
                    day="numeric"
                    month="short"
                    year="numeric"
                  />
                </Span>
              </P>
            </Container>
          </Flex>
        </Flex>
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
            data={data?.customData}
            onChange={customData => dispatchChange('customData', customData)}
          />
        </Box>
      )}
      {temporaryInterval !== undefined && (
        <ChangeTierWarningModal
          show
          tierName={tier.name}
          onClose={() => setTemporaryInterval(undefined)}
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
    customData: PropTypes.object,
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
