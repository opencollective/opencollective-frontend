import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { themeGet } from '@styled-system/theme-get';
import { first, get, last, startCase } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import INTERVALS from '../../lib/constants/intervals';
import { PAYMENT_METHOD_SERVICE } from '../../lib/constants/payment-methods';
import { AmountTypes } from '../../lib/constants/tiers-types';
import { formatCurrency } from '../../lib/currency-utils';
import { getIntervalFromContributionFrequency } from '../../lib/date-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { DEFAULT_MINIMUM_AMOUNT, DEFAULT_PRESETS } from '../../lib/tier-utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import I18nFormatters from '../I18nFormatters';
import LoadingPlaceholder from '../LoadingPlaceholder';
import PayWithPaypalButton from '../PayWithPaypalButton';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputAmount from '../StyledInputAmount';
import StyledRadioList from '../StyledRadioList';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

import { getSubscriptionStartDate } from './AddPaymentMethod';

const TierBox = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.300')};
`;

const messages = defineMessages({
  customTier: {
    id: 'ContributionType.Custom',
    defaultMessage: 'Custom contribution',
  },
});

const updateOrderMutation = gql`
  mutation UpdateOrder(
    $order: OrderReferenceInput!
    $amount: AmountInput
    $tier: TierReferenceInput
    $paypalSubscriptionId: String
  ) {
    updateOrder(order: $order, amount: $amount, tier: $tier, paypalSubscriptionId: $paypalSubscriptionId) {
      id
      status
      frequency
      amount {
        value
        currency
      }
      tier {
        id
        name
      }
    }
  }
`;

export const tiersQuery = gql`
  query UpdateOrderPopUpTiers($slug: String!) {
    account(slug: $slug) {
      id
      slug
      name
      type
      currency
      settings
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            name
            interval
            amount {
              value
              valueInCents
              currency
            }
            minimumAmount {
              value
              valueInCents
              currency
            }
            amountType
            presets
          }
        }
      }
    }
  }
`;

// TODO: internationalize me
const OTHER_LABEL = 'Other';

export const useUpdateOrder = ({ contribution, onSuccess }) => {
  const { toast } = useToast();
  const [submitUpdateOrder, { loading }] = useMutation(updateOrderMutation, { context: API_V2_CONTEXT });
  return {
    isSubmittingOrder: loading,
    updateOrder: async (selectedTier, selectedAmountOption, inputAmountValue, paypalSubscriptionId = null) => {
      try {
        await submitUpdateOrder({
          variables: {
            order: { id: contribution.id },
            paypalSubscriptionId,
            amount: {
              valueInCents: selectedAmountOption.label === OTHER_LABEL ? inputAmountValue : selectedAmountOption.value,
            },
            tier: {
              id: selectedTier?.id || null,
              isCustom: !selectedTier,
            },
          },
        });
        toast({
          variant: 'success',
          message: (
            <FormattedMessage
              id="subscription.createSuccessUpdated"
              defaultMessage="Your recurring contribution has been <strong>updated</strong>."
              values={I18nFormatters}
            />
          ),
        });
        onSuccess();
      } catch (error) {
        const errorMsg = getErrorFromGraphqlException(error).message;
        toast({ variant: 'error', message: errorMsg });
        return false;
      }
    },
  };
};

const getTierAmountOptions = (selectedTier, contribution, locale) => {
  const currency = contribution.amount.currency;
  const buildOptionFromAmount = amount => ({ label: formatCurrency(amount, currency, { locale }), value: amount });
  if (selectedTier && !selectedTier?.flexible) {
    return [buildOptionFromAmount(selectedTier.amount)];
  } else {
    // TODO: use getTierPresets from tier-utils
    const presets = selectedTier?.presets || DEFAULT_PRESETS;
    const otherValue = null; // The way it's currently implemented, it doesn't need a value
    return [...presets.map(buildOptionFromAmount), { label: OTHER_LABEL, value: otherValue }];
  }
};

const getContributeOptions = (intl, contribution, tiers, disableCustomContributions) => {
  const tierOptions = (tiers || [])
    .filter(tier => tier.interval !== null)
    .map(tier => ({
      key: `${contribution.id}-tier-${tier.id}`,
      title: tier.name,
      flexible: tier.amountType === AmountTypes.FLEXIBLE,
      amount: tier.amountType === AmountTypes.FLEXIBLE ? tier.minimumAmount.valueInCents : tier.amount.valueInCents,
      id: tier.id,
      currency: tier.amount.currency,
      interval: tier.interval,
      presets: tier.presets,
      minimumAmount:
        tier.amountType === AmountTypes.FLEXIBLE ? tier.minimumAmount.valueInCents : DEFAULT_MINIMUM_AMOUNT,
    }));
  if (!disableCustomContributions) {
    tierOptions.unshift({
      key: `${contribution.id}-custom-tier`,
      title: intl.formatMessage(messages.customTier),
      flexible: true,
      amount: DEFAULT_MINIMUM_AMOUNT,
      id: null,
      currency: contribution.amount.currency,
      interval: contribution.frequency.toLowerCase().slice(0, -2),
      presets: DEFAULT_PRESETS,
      minimumAmount: DEFAULT_MINIMUM_AMOUNT,
      isCustom: true,
    });
  }
  return tierOptions;
};

const geSelectedContributeOption = (contribution, tiersOptions) => {
  const defaultContribution =
    tiersOptions.find(option => option.isCustom) || tiersOptions.find(option => option.interval);
  if (!contribution.tier) {
    return defaultContribution;
  } else {
    // for some collectives if a tier has been deleted it won't have moved the contribution
    // to the custom 'null' tier so we have to check for that
    const matchedTierOption = tiersOptions.find(option => option.id === contribution.tier.id);
    return !matchedTierOption ? defaultContribution : matchedTierOption;
  }
};

export const useContributeOptions = (order, tiers, tiersLoading, disableCustomContributions) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [selectedContributeOption, setSelectedContributeOption] = useState(null);
  const [amountOptions, setAmountOptions] = useState(null);
  const [selectedAmountOption, setSelectedAmountOption] = useState(null);
  const [inputAmountValue, setInputAmountValue] = useState(null);

  const contributeOptions = React.useMemo(() => {
    return getContributeOptions(intl, order, tiers, disableCustomContributions);
  }, [intl, order, tiers, disableCustomContributions]);

  if (contributeOptions.length === 0) {
    throw new Error('Could not compute at least one contribution option.');
  }

  if (contributeOptions && !selectedContributeOption && !tiersLoading) {
    const selectedContribution = geSelectedContributeOption(order, contributeOptions);
    if (!selectedContribution) {
      throw new Error('Could not compute a selected contribution option.');
    }
    setSelectedContributeOption(selectedContribution);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedContributeOption !== null) {
      const options = getTierAmountOptions(selectedContributeOption, order, intl.locale);
      setAmountOptions(options);

      let option;
      if ((selectedContributeOption.id || null) !== (order.tier?.id || null)) {
        // Just pick first if tier is different than current one
        option = first(options);
      } else {
        // Find one of the presets, or default to the last one which is supposed to be "Other" by convention
        option = options.find(option => option.value === order.amount.valueInCents) || last(options);
      }
      setSelectedAmountOption(option);
      setInputAmountValue(option.value || order.amount.valueInCents);
    }
  }, [selectedContributeOption]);

  return {
    loading,
    contributeOptions,
    amountOptions,
    selectedContributeOption,
    selectedAmountOption,
    inputAmountValue,
    setSelectedContributeOption,
    setSelectedAmountOption,
    setInputAmountValue,
  };
};

export const ContributionInterval = ({ tier, contribution }) => {
  const isActiveTier = contribution.tier?.id && contribution.tier.id === tier.id;
  let interval = null;

  if (isActiveTier) {
    interval = getIntervalFromContributionFrequency(contribution.frequency);
  } else if (tier?.interval === INTERVALS.flexible) {
    // TODO: We should ideally have a select for that
    interval = getIntervalFromContributionFrequency(contribution.frequency) || INTERVALS.month;
  } else if (tier?.interval && tier.interval !== INTERVALS.flexible) {
    interval = tier.interval;
  }

  // Show message only if there's an active interval
  if (interval) {
    return (
      <P fontSize="12px" fontWeight="500">
        <FormattedMessage
          id="tier.interval"
          defaultMessage="per {interval, select, month {month} year {year} other {}}"
          values={{ interval }}
        />
      </P>
    );
  } else {
    return null;
  }
};

ContributionInterval.propTypes = {
  tier: PropTypes.shape({
    id: PropTypes.string,
    interval: PropTypes.string,
  }),
  contribution: PropTypes.shape({
    tier: PropTypes.shape({
      id: PropTypes.string,
      interval: PropTypes.string,
    }),
    frequency: PropTypes.string,
  }),
  onCloseEdit: PropTypes.func,
};

const UpdateOrderPopUp = ({ contribution, onCloseEdit }) => {
  // GraphQL mutations and queries
  const queryVariables = { slug: contribution.toAccount.slug };
  const { data, loading: tiersLoading } = useQuery(tiersQuery, { variables: queryVariables, context: API_V2_CONTEXT });

  // state management
  const { locale } = useIntl();
  const { toast } = useToast();
  const { isSubmittingOrder, updateOrder } = useUpdateOrder({ contribution, onSuccess: onCloseEdit });
  const tiers = get(data, 'account.tiers.nodes', null);
  const disableCustomContributions = get(data, 'account.settings.disableCustomContributions', false);
  const contributeOptionsState = useContributeOptions(contribution, tiers, tiersLoading, disableCustomContributions);
  const {
    amountOptions,
    inputAmountValue,
    contributeOptions,
    selectedContributeOption,
    selectedAmountOption,
    setInputAmountValue,
    setSelectedContributeOption,
  } = contributeOptionsState;
  const selectedTier = selectedContributeOption?.isCustom ? null : selectedContributeOption;
  const isPaypal = contribution.paymentMethod.service === PAYMENT_METHOD_SERVICE.PAYPAL;
  const tipAmount = contribution.platformTipAmount?.valueInCents || 0;
  const newAmount = selectedAmountOption?.label === OTHER_LABEL ? inputAmountValue : selectedAmountOption?.value;
  const newTotalAmount = newAmount + tipAmount; // For now tip can't be updated, we're just carrying it over

  // When we change the amount option (One of the presets or Other)
  const setSelectedAmountOption = ({ label, value }) => {
    // Always set "Other" input value to the last one selected
    // "Other" itself doesn't have a pre-defined value
    if (label !== OTHER_LABEL) {
      setInputAmountValue(value);
    }
    contributeOptionsState.setSelectedAmountOption({ label, value });
  };

  return (
    <Fragment>
      <Flex width={1} alignItems="center" justifyContent="center" minHeight={50} px={3}>
        <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
          <FormattedMessage id="subscription.menu.updateTier" defaultMessage="Update tier" />
        </P>
        <Flex flexGrow={1} alignItems="center">
          <StyledHr width="100%" mx={2} />
        </Flex>
      </Flex>
      {tiersLoading || contributeOptionsState.loading ? (
        <LoadingPlaceholder height={100} />
      ) : (
        <StyledRadioList
          id="ContributionTier"
          name={`${contribution.id}-ContributionTier`}
          keyGetter="key"
          options={contributeOptions}
          onChange={({ value }) => setSelectedContributeOption(value)}
          value={selectedContributeOption?.key}
        >
          {({
            radio,
            checked,
            value: { id, title, subtitle, amount, flexible, currency, interval, minimumAmount },
          }) => (
            <TierBox minHeight={50} py={2} px={3} bg="white.full" data-cy="recurring-contribution-tier-box">
              <Flex alignItems="center">
                <Box as="span" mr={3} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex flexDirection="column">
                  <P fontWeight={subtitle ? 600 : 400} color="black.900">
                    {startCase(title)}
                  </P>
                  {checked && flexible ? (
                    <Fragment>
                      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                      <div onClick={e => e.preventDefault()}>
                        <StyledSelect
                          inputId={`tier-amount-select-${contribution.id}`}
                          data-cy="tier-amount-select"
                          onChange={setSelectedAmountOption}
                          value={selectedAmountOption}
                          options={amountOptions}
                          my={2}
                          minWidth={150}
                          isSearchable={false}
                        />
                      </div>
                      <ContributionInterval contribution={contribution} tier={{ id, interval }} />
                      {selectedAmountOption?.label === OTHER_LABEL && (
                        <Flex flexDirection="column">
                          <P fontSize="12px" fontWeight="600" my={2}>
                            <FormattedMessage id="RecurringContributions.customAmount" defaultMessage="Custom amount" />
                          </P>
                          <Box>
                            <StyledInputAmount
                              type="number"
                              data-cy="recurring-contribution-custom-amount-input"
                              currency={currency}
                              value={inputAmountValue}
                              onChange={setInputAmountValue}
                              min={DEFAULT_MINIMUM_AMOUNT}
                              px="2px"
                            />
                          </Box>
                          <P fontSize="12px" fontWeight="600" my={2}>
                            <FormattedMessage
                              defaultMessage="Min. amount: {minAmount}"
                              id="RecurringContributions.minAmount"
                              values={{
                                minAmount: formatCurrency(minimumAmount, currency, { locale }),
                              }}
                            />
                          </P>
                        </Flex>
                      )}
                    </Fragment>
                  ) : (
                    <Fragment>
                      {flexible && (
                        <P fontSize="12px" fontWeight={400} lineHeight="18px" color="black.500">
                          <FormattedMessage id="ContributeTier.StartsAt" defaultMessage="Starts at" />
                        </P>
                      )}
                      <P fontWeight={400} color="black.900">
                        <FormattedMoneyAmount amount={amount} interval={interval.toLowerCase()} currency={currency} />
                      </P>
                    </Fragment>
                  )}
                </Flex>
              </Flex>
            </TierBox>
          )}
        </StyledRadioList>
      )}
      <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center">
        <Flex flexGrow={1} alignItems="center">
          <StyledHr width="100%" />
        </Flex>
      </Flex>
      <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" minHeight={50}>
        <StyledButton buttonSize="tiny" minWidth={75} onClick={onCloseEdit} height={25} mr={2}>
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        {isPaypal && selectedAmountOption ? (
          <PayWithPaypalButton
            order={contribution}
            isLoading={!selectedAmountOption}
            isSubmitting={isSubmittingOrder}
            totalAmount={newTotalAmount}
            currency={contribution.amount.currency}
            interval={
              selectedContributeOption?.interval || getIntervalFromContributionFrequency(contribution.frequency)
            }
            host={contribution.toAccount.host}
            collective={contribution.toAccount}
            tier={selectedTier}
            style={{ height: 25, size: 'small' }}
            subscriptionStartDate={getSubscriptionStartDate(contribution)}
            onError={e => toast({ variant: 'error', title: e.message })}
            onSuccess={({ subscriptionId }) =>
              updateOrder(selectedTier, selectedAmountOption, inputAmountValue, subscriptionId)
            }
          />
        ) : (
          <StyledButton
            height={25}
            minWidth={75}
            buttonSize="tiny"
            buttonStyle="secondary"
            loading={isSubmittingOrder}
            data-cy="recurring-contribution-update-order-button"
            onClick={() => updateOrder(selectedTier, selectedAmountOption, inputAmountValue)}
          >
            <FormattedMessage id="actions.update" defaultMessage="Update" />
          </StyledButton>
        )}
      </Flex>
    </Fragment>
  );
};

UpdateOrderPopUp.propTypes = {
  contribution: PropTypes.object.isRequired,
  onCloseEdit: PropTypes.func,
};

export default UpdateOrderPopUp;
