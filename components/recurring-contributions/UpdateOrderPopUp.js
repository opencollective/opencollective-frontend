import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/react-hooks';
import themeGet from '@styled-system/theme-get';
import gql from 'graphql-tag';
import { first, get, startCase } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputAmount from '../StyledInputAmount';
import StyledRadioList from '../StyledRadioList';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';

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
  mutation updateOrderTierOrAmount($order: OrderReferenceInput!, $amount: Int, $tier: TierReferenceInput) {
    updateOrder(order: $order, amount: $amount, tier: $tier) {
      id
    }
  }
`;

const getTiersQuery = gql`
  query UpdateOrderPopUpQuery($collectiveSlug: String!) {
    Collective(slug: $collectiveSlug) {
      id
      slug
      name
      type
      currency
      settings
      tiers {
        id
        name
        slug
        interval
        currency
        amount
        minimumAmount
        button
        amountType
        endsAt
        type
        presets
      }
    }
  }
`;

const UpdateOrderPopUp = ({ setMenuState, contribution, createNotification, setShowPopup }) => {
  const intl = useIntl();

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
  const { data } = useQuery(getTiersQuery, {
    variables: {
      collectiveSlug: contribution.toAccount.slug,
    },
  });

  // Tier data wrangling

  const getDefaultTier = tiers => {
    if (contribution.tier === null) {
      return first(tiers);
    } else {
      return tiers.find(option => option.title.toLowerCase() === contribution.tier.name.toLowerCase());
    }
  };

  const tiers = get(data, 'Collective.tiers', null);
  const mappedTierOptions = React.useMemo(() => {
    if (!tiers) {
      return null;
    }
    const customTierOption = {
      key: 'custom-tier',
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
        key: `tier-${tier.id}`,
        title: tier.name,
        flexible: tier.amountType === 'FLEXIBLE' ? true : false,
        amount: tier.amountType === 'FLEXIBLE' ? tier.minimumAmount : tier.amount,
        id: tier.id,
        currency: tier.currency,
        interval: tier.interval,
        presets: tier.presets,
        minimumAmount: tier.amountType === 'FLEXIBLE' ? tier.minimumAmount : 100,
      }));
    tierOptions.unshift(customTierOption);
    return tierOptions;
  }, [tiers]);

  useEffect(() => {
    if (mappedTierOptions && selectedTier === null) {
      setSelectedTier(getDefaultTier(mappedTierOptions));
      setLoadingDefaultTier(false);
    }
  }, [mappedTierOptions]);

  const getTierOptions = () => {
    // selectedTier.presets if it's the default tier, but selectedTier.value.preset afterwards if it's a radio list selection
    const presets = selectedTier.presets || selectedTier.value?.presets || [500, 1000, 2000, 5000];
    const objectArray = [];

    presets.map(preset => {
      const optionObject = {
        label: formatCurrency(preset, contribution.amount.currency),
        value: preset,
      };
      objectArray.push(optionObject);
    });
    objectArray.push({ label: 'Other', value: 100 });
    return objectArray;
  };

  useEffect(() => {
    if (selectedTier !== null) {
      const options = getTierOptions();
      setAmountOptions(options);
      setSelectedAmountOption(first(options));
    }
  }, [selectedTier]);

  return (
    <Fragment>
      <Flex width={1} alignItems="center" justifyContent="center" minHeight={45}>
        <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
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
          name="ContributionTier"
          keyGetter="key"
          options={mappedTierOptions}
          onChange={setSelectedTier}
          defaultValue={selectedTier?.key}
          value={selectedTier}
        >
          {({ radio, checked, value: { title, subtitle, amount, flexible, currency, interval, minimumAmount } }) => (
            <TierBox minheight={50} p={2} bg="white.full">
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
                      <StyledSelect
                        menuPortalTarget={document.body}
                        onChange={setSelectedAmountOption}
                        value={selectedAmountOption}
                        options={amountOptions}
                        my={2}
                        minWidth={150}
                      />
                      {selectedAmountOption?.label === 'Other' && (
                        <Flex flexDirection="column">
                          <P fontSize="Caption" fontWeight="600" my={2}>
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
                          <P fontSize="Caption" fontWeight="600" my={2}>
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
                        <P fontSize="Caption" fontWeight={400} lineHeight="Caption" color="black.500">
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
      <Flex flexGrow={1 / 4} width={1} alignItems="center" justifyContent="center" minHeight={45}>
        <StyledButton
          buttonSize="tiny"
          onClick={() => {
            setMenuState('mainMenu');
          }}
        >
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        <StyledButton
          ml={2}
          buttonSize="tiny"
          buttonStyle="secondary"
          loading={loadingUpdateOrder}
          onClick={async () => {
            try {
              await submitUpdateOrder({
                variables: {
                  order: { id: contribution.id },
                  amount: selectedAmountOption.label === 'Other' ? inputAmountValue : selectedAmountOption.value,
                  tier: {
                    legacyId: selectedTier.value ? selectedTier.value.id : selectedTier.id,
                  },
                },
              });
              createNotification('update');
              setShowPopup(false);
            } catch (error) {
              const errorMsg = getErrorFromGraphqlException(error).message;
              createNotification('error', errorMsg);
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
  router: PropTypes.object.isRequired,
  contribution: PropTypes.object.isRequired,
  createNotification: PropTypes.func,
  setShowPopup: PropTypes.func,
};

export default withRouter(UpdateOrderPopUp);
