import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import themeGet from '@styled-system/theme-get';
import { first, get, startCase } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import INTERVALS from '../../lib/constants/intervals';
import { formatCurrency } from '../../lib/currency-utils';
import { getIntervalFromContributionFrequency } from '../../lib/date-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

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
import { TOAST_TYPE, useToasts } from '../ToastProvider';

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

const updateOrderMutation = gqlV2/* GraphQL */ `
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

const tiersQuery = gqlV2/* GraphQL */ `
  query UpdateOrderPopUpTiers($slug: String!) {
    collective(slug: $slug) {
      id
      slug
      name
      type
      currency
      settings
      tiers {
        nodes {
          id
          name
          interval
          amount {
            value
            currency
          }
          minimumAmount {
            value
          }
          amountType
          presets
        }
      }
    }
  }
`;

const useUpdateOrder = ({ contribution, onSuccess }) => {
  const { addToast } = useToasts();
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
              value: selectedAmountOption.label === 'Other' ? inputAmountValue / 100 : selectedAmountOption.value / 100,
            },
            tier: {
              id: selectedTier?.id || null,
            },
          },
        });
        addToast({
          type: TOAST_TYPE.SUCCESS,
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
        addToast({ type: TOAST_TYPE.ERROR, message: errorMsg });
        return false;
      }
    },
  };
};

const getTierAmountOptions = (selectedTier, contribution) => {
  const currency = contribution.amount.currency;
  const buildOptionFromAmount = amount => ({ label: formatCurrency(amount, currency), value: amount });
  if (selectedTier && !selectedTier?.flexible) {
    return [buildOptionFromAmount(selectedTier.amount)];
  } else {
    const presets = selectedTier?.presets || [500, 1000, 2000, 5000];
    return [...presets.map(buildOptionFromAmount), { label: 'Other', value: 100 }];
  }
};

const getContributeOptions = (intl, contribution, tiers, disableCustomContributions) => {
  const tierOptions = (tiers || [])
    .filter(tier => tier.interval !== null)
    .map(tier => ({
      key: `${contribution.id}-tier-${tier.id}`,
      title: tier.name,
      flexible: tier.amountType === 'FLEXIBLE' ? true : false,
      amount: tier.amountType === 'FLEXIBLE' ? tier.minimumAmount.value * 100 : tier.amount.value * 100,
      id: tier.id,
      currency: tier.amount.currency,
      interval: tier.interval,
      presets: tier.presets,
      minimumAmount: tier.amountType === 'FLEXIBLE' ? tier.minimumAmount.value * 100 : 100,
    }));
  if (!disableCustomContributions) {
    tierOptions.unshift({
      key: `${contribution.id}-custom-tier`,
      title: intl.formatMessage(messages.customTier),
      flexible: true,
      amount: 100,
      id: null,
      currency: contribution.amount.currency,
      interval: contribution.frequency.toLowerCase().slice(0, -2),
      presets: [500, 1000, 2000, 5000],
      minimumAmount: 100,
      isCustom: true,
    });
  }
  return tierOptions;
};

const getDefaultContributeOption = (contribution, tiersOptions) => {
  const customContribution = tiersOptions.find(option => option.isCustom);
  if (!contribution.tier) {
    return customContribution;
  } else {
    // for some collectives if a tier has been deleted it won't have moved the contribution
    // to the custom 'null' tier so we have to check for that
    const matchedTierOption = tiersOptions.find(option => option.id === contribution.tier.id);
    return !matchedTierOption ? customContribution : matchedTierOption;
  }
};

const useContributeOptions = (order, tiers, disableCustomContributions) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [selectedContributeOption, setSelectedContributeOption] = useState(null);
  const [amountOptions, setAmountOptions] = useState(null);
  const [selectedAmountOption, setSelectedAmountOption] = useState(null);
  const contributeOptions = React.useMemo(() => {
    return getContributeOptions(intl, order, tiers, disableCustomContributions);
  }, [intl, order, tiers, disableCustomContributions]);

  useEffect(() => {
    if (contributeOptions && !selectedContributeOption) {
      setSelectedContributeOption(getDefaultContributeOption(order, contributeOptions));
      setLoading(false);
    }
  }, [contributeOptions]);

  useEffect(() => {
    if (selectedContributeOption !== null) {
      const options = getTierAmountOptions(selectedContributeOption?.value, order);
      setAmountOptions(options);
      setSelectedAmountOption(first(options));
    }
  }, [selectedContributeOption]);

  return {
    loading,
    contributeOptions,
    amountOptions,
    selectedContributeOption,
    selectedAmountOption,
    setSelectedContributeOption,
    setSelectedAmountOption,
  };
};

const ContributionInterval = ({ tier, contribution }) => {
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

const UpdateOrderPopUp = ({ setMenuState, contribution, onCloseEdit }) => {
  // GraphQL mutations and queries
  const queryVariables = { slug: contribution.toAccount.slug };
  const { data } = useQuery(tiersQuery, { variables: queryVariables, context: API_V2_CONTEXT });

  // state management
  const { addToast } = useToasts();
  const [inputAmountValue, setInputAmountValue] = useState(100);
  const { isSubmittingOrder, updateOrder } = useUpdateOrder({ contribution, onSuccess: onCloseEdit });
  const tiers = get(data, 'collective.tiers.nodes', null);
  const disableCustomContributions = get(data, 'collective.settings.disableCustomContributions', false);
  const contributeOptionsState = useContributeOptions(contribution, tiers, disableCustomContributions);
  const { selectedContributeOption, selectedAmountOption } = contributeOptionsState;
  const selectedTier = selectedContributeOption?.isCustom ? null : selectedContributeOption;
  const isPaypal = contribution.paymentMethod.service === 'PAYPAL';

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
      {contributeOptionsState.loading ? (
        <LoadingPlaceholder height={100} />
      ) : (
        <StyledRadioList
          id="ContributionTier"
          name={`${contribution.id}-ContributionTier`}
          keyGetter="key"
          options={contributeOptionsState.contributeOptions}
          onChange={({ value }) => contributeOptionsState.setSelectedContributeOption(value)}
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
                          onChange={contributeOptionsState.setSelectedAmountOption}
                          value={selectedAmountOption}
                          options={contributeOptionsState.amountOptions}
                          my={2}
                          minWidth={150}
                          isSearchable={false}
                        />
                      </div>
                      <ContributionInterval contribution={contribution} tier={{ id, interval }} />
                      {selectedAmountOption?.label === 'Other' && (
                        <Flex flexDirection="column">
                          <P fontSize="12px" fontWeight="600" my={2}>
                            <FormattedMessage id="RecurringContributions.customAmount" defaultMessage="Custom amount" />
                          </P>
                          <Box>
                            <StyledInputAmount
                              type="number"
                              currency={currency}
                              value={inputAmountValue}
                              onChange={setInputAmountValue}
                              min={100}
                              precision={3}
                              px="2px"
                            />
                          </Box>
                          <P fontSize="12px" fontWeight="600" my={2}>
                            <FormattedMessage
                              defaultMessage="Min. amount: {minAmount}"
                              id="RecurringContributions.minAmount"
                              values={{
                                minAmount: formatCurrency(minimumAmount, currency),
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
        <StyledButton buttonSize="tiny" minWidth={75} onClick={() => setMenuState('mainMenu')} height={25} mr={2}>
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        {isPaypal && selectedAmountOption ? (
          <PayWithPaypalButton
            isLoading={!selectedAmountOption}
            isSubmitting={isSubmittingOrder}
            totalAmount={selectedAmountOption?.label === 'Other' ? inputAmountValue : selectedAmountOption?.value}
            currency={contribution.amount.currency}
            interval={
              selectedContributeOption?.interval || getIntervalFromContributionFrequency(contribution.frequency)
            }
            host={contribution.toAccount.host}
            collective={contribution.toAccount}
            tier={selectedTier}
            style={{ height: 25, size: 'small' }}
            subscriptionStartDate={getSubscriptionStartDate(contribution)}
            onError={e => addToast({ type: TOAST_TYPE.ERROR, title: e.message })}
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
            <FormattedMessage id="subscription.updateAmount.update.btn" defaultMessage="Update" />
          </StyledButton>
        )}
      </Flex>
    </Fragment>
  );
};

UpdateOrderPopUp.propTypes = {
  data: PropTypes.object,
  setMenuState: PropTypes.func,
  contribution: PropTypes.object.isRequired,
  onCloseEdit: PropTypes.func,
};

export default UpdateOrderPopUp;
