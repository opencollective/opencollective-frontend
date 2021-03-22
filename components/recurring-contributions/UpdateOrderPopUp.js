import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import themeGet from '@styled-system/theme-get';
import { first, get, startCase } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import I18nFormatters from '../I18nFormatters';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputAmount from '../StyledInputAmount';
import StyledRadioList from '../StyledRadioList';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

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
  mutation UpdateOrder($order: OrderReferenceInput!, $amount: AmountInput, $tier: TierReferenceInput) {
    updateOrder(order: $order, amount: $amount, tier: $tier) {
      id
      status
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

const getTierOptions = (selectedTier, contribution) => {
  let optionObject;
  const objectArray = [];
  const flexible = selectedTier.flexible || selectedTier.value?.flexible;
  if (!flexible) {
    optionObject = {
      label: formatCurrency(selectedTier.amount || selectedTier.value?.amount, contribution.amount.currency),
      value: selectedTier.amount || selectedTier.value?.amount,
    };
    objectArray.push(optionObject);
    return objectArray;
  }
  // selectedTier.presets if it's the default tier, but selectedTier.value.preset afterwards if it's a radio list selection
  const presets = selectedTier.presets || selectedTier.value?.presets || [500, 1000, 2000, 5000];

  presets.map(preset => {
    optionObject = {
      label: formatCurrency(preset, contribution.amount.currency),
      value: preset,
    };
    objectArray.push(optionObject);
  });
  objectArray.push({ label: 'Other', value: 100 });
  return objectArray;
};

const UpdateOrderPopUp = ({ setMenuState, contribution, setShowPopup }) => {
  const intl = useIntl();
  const { addToast } = useToasts();

  // state management
  const [loadingDefaultTier, setLoadingDefaultTier] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [amountOptions, setAmountOptions] = useState(null);
  const [selectedAmountOption, setSelectedAmountOption] = useState(null);
  const [inputAmountValue, setInputAmountValue] = useState(100);

  // GraphQL mutations and queries
  const [submitUpdateOrder, { loading: loadingUpdateOrder }] = useMutation(updateOrderMutation, {
    context: API_V2_CONTEXT,
  });
  const { data } = useQuery(tiersQuery, {
    variables: { slug: contribution.toAccount.slug },
    context: API_V2_CONTEXT,
  });

  // Tier data wrangling

  const getDefaultTier = tiers => {
    if (contribution.tier === null) {
      return tiers.find(option => option.key === `${contribution.id}-custom-tier`);
    } else {
      // for some collectives if a tier has been deleted it won't have moved the contribution
      // to the custom 'null' tier so we have to check for that
      const matchedTier = tiers.find(option => option.id === contribution.tier.id);
      return !matchedTier ? tiers.find(option => option.key === `${contribution.id}-custom-tier`) : matchedTier;
    }
  };

  const tiers = get(data, 'collective.tiers.nodes', null);
  const disableCustomContributions = get(data, 'collective.settings.disableCustomContributions', false);
  const mappedTierOptions = React.useMemo(() => {
    if (!tiers) {
      return null;
    }
    const customTierOption = {
      key: `${contribution.id}-custom-tier`,
      title: intl.formatMessage(messages.customTier),
      flexible: true,
      amount: 100,
      id: null,
      currency: contribution.amount.currency,
      interval: contribution.frequency.toLowerCase().slice(0, -2),
      presets: [500, 1000, 2000, 5000],
      minimumAmount: 100,
    };
    const tierOptions = tiers
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
      tierOptions.unshift(customTierOption);
    }
    return tierOptions;
  }, [tiers]);

  useEffect(() => {
    if (mappedTierOptions && selectedTier === null) {
      setSelectedTier(getDefaultTier(mappedTierOptions));
      setLoadingDefaultTier(false);
    }
  }, [mappedTierOptions]);

  useEffect(() => {
    if (selectedTier !== null) {
      const options = getTierOptions(selectedTier, contribution);
      setAmountOptions(options);
      setSelectedAmountOption(first(options));
    }
  }, [selectedTier]);

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
      {loadingDefaultTier ? (
        <LoadingPlaceholder height={100} />
      ) : (
        <StyledRadioList
          id="ContributionTier"
          name={`${contribution.id}-ContributionTier`}
          keyGetter="key"
          options={mappedTierOptions}
          onChange={setSelectedTier}
          value={selectedTier?.key}
        >
          {({ radio, checked, value: { title, subtitle, amount, flexible, currency, interval, minimumAmount } }) => (
            <TierBox minheight={50} py={2} px={3} bg="white.full" data-cy="recurring-contribution-tier-box">
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
                      <div
                        onClick={e => {
                          e.preventDefault();
                        }}
                      >
                        <StyledSelect
                          data-cy="tier-amount-select"
                          onChange={setSelectedAmountOption}
                          value={selectedAmountOption}
                          options={amountOptions}
                          my={2}
                          minWidth={150}
                          isSearchable={false}
                        />
                      </div>
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
        <StyledButton
          buttonSize="tiny"
          minWidth={75}
          onClick={() => {
            setMenuState('mainMenu');
          }}
        >
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        <StyledButton
          ml={2}
          minWidth={75}
          buttonSize="tiny"
          buttonStyle="secondary"
          loading={loadingUpdateOrder}
          data-cy="recurring-contribution-update-order-button"
          onClick={async () => {
            try {
              await submitUpdateOrder({
                variables: {
                  order: { id: contribution.id },
                  amount: {
                    value:
                      selectedAmountOption.label === 'Other'
                        ? inputAmountValue / 100
                        : selectedAmountOption.value / 100,
                  },
                  tier: {
                    id: selectedTier.value ? selectedTier.value.id : selectedTier.id,
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
              setShowPopup(false);
            } catch (error) {
              const errorMsg = getErrorFromGraphqlException(error).message;
              addToast({
                type: TOAST_TYPE.ERROR,
                message: errorMsg,
              });
              return false;
            }
          }}
        >
          <FormattedMessage id="subscription.updateAmount.update.btn" defaultMessage="Update" />
        </StyledButton>
      </Flex>
    </Fragment>
  );
};

UpdateOrderPopUp.propTypes = {
  data: PropTypes.object,
  setMenuState: PropTypes.func,
  contribution: PropTypes.object.isRequired,
  setShowPopup: PropTypes.func,
};

export default UpdateOrderPopUp;
