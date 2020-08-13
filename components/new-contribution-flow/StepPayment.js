import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import themeGet from '@styled-system/theme-get';
import { first, get, isEmpty } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { GQLV2_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Container from '../../components/Container';
import { Box, Flex } from '../../components/Grid';
import Link from '../../components/Link';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import NewCreditCardForm from '../../components/NewCreditCardForm';
import { withStripeLoader } from '../../components/StripeProvider';
import StyledRadioList from '../../components/StyledRadioList';
import { P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import { ERROR_MESSAGES } from './constants';
import { generatePaymentMethodOptions } from './utils';

const PaymentMethodBox = styled(Container)`
  display: flex;
  flex-direction: column;
  background: ${themeGet('colors.white.full')};
  &:hover {
    background: ${themeGet('colors.black.50')};
  }
`;

const paymentMethodsQuery = gqlV2/* GraphQL */ `
  query ContributionFlowPaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(types: ["creditcard", "virtualcard", "prepaid", "collective"]) {
        id
        name
        data
        service
        type
        balance {
          value
          currency
        }
        account {
          id
        }
        limitedToHosts {
          id
          legacyId
          slug
        }
      }
    }
  }
`;

const messages = defineMessages({
  [ERROR_MESSAGES.ERROR_LOW_BALANCE]: {
    id: 'NewContribute.noCollectiveBalance',
    defaultMessage:
      'The balance of this collective is too low to make orders from it. Add funds to {collective} by making a donation to it first.',
  },
  [ERROR_MESSAGES.ERROR_DIFFERENT_HOST]: {
    id: 'NewContribute.noCollectivePaymentMethodsAvailable.differentHost',
    defaultMessage: 'You cannot make donations to the a Collective that has a different fiscal Host.',
  },
  [ERROR_MESSAGES.ERROR_NO_PAYMENT_METHODS]: {
    id: 'NewContribute.noPaymentMethodsAvailable',
    defaultMessage: 'There are no payment methods available.',
  },
});

const NewContributionFlowStepPayment = ({
  LoggedInUser,
  stepDetails,
  stepProfile,
  stepPayment,
  collective,
  onChange,
  loadStripe,
  hideCreditCardPostalCode,
}) => {
  const intl = useIntl();
  const [loadingSelectedPaymentMethod, setLoadingSelectedPaymentMethod] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState(false);
  const [paymentObject, setPaymentObject] = useState(null);

  const supportedPaymentMethods = get(collective, 'host.supportedPaymentMethods', null);
  const hostHasStripe = supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD);
  const slugForQuery = stepProfile.isIncognito ? LoggedInUser.collective.slug : stepProfile.slug;
  const skipPaymentMethodsQuery = !stepProfile.slug && !stepProfile.isIncognito;

  // GraphQL mutations and queries
  const { data, loading: loadingPaymentMethodsFromGraphQL } = useQuery(paymentMethodsQuery, {
    variables: {
      slug: slugForQuery,
    },
    context: API_V2_CONTEXT,
    skip: skipPaymentMethodsQuery,
  });

  // load stripe on mount
  useEffect(() => {
    if (hostHasStripe) {
      loadStripe();
    }
  }, [hostHasStripe]);

  // data handling
  const paymentMethods = get(data, 'account.paymentMethods', null) || [];
  const paymentOptions = React.useMemo(() => {
    if (!skipPaymentMethodsQuery && loadingPaymentMethodsFromGraphQL) {
      return;
    }
    try {
      return generatePaymentMethodOptions(
        paymentMethods,
        supportedPaymentMethods,
        stepProfile,
        stepDetails,
        collective,
      );
    } catch (error) {
      setPaymentMethodsError({ messageId: error.message });
      setLoadingSelectedPaymentMethod(false);
    }
  }, [loadingPaymentMethodsFromGraphQL, stepProfile]);

  const setNewPaymentMethod = option => {
    if (paymentMethodsError) {
      return;
    }

    const optionValue = option.value || option;

    if (!option.name || option.name === 'PaymentMethod') {
      setPaymentObject({
        paymentMethod: optionValue,
        title: optionValue.title,
        key: optionValue.key,
      });
    } else if (option.name === 'newCreditCardInfo') {
      setPaymentObject({
        ...paymentObject,
        paymentMethod: { type: 'creditcard', service: 'stripe' },
        key: 'newCreditCard',
        save: true,
        isNew: true,
        data: optionValue,
        error: null,
      });
    } else if (option.name === 'save') {
      setPaymentObject({
        ...paymentObject,
        save: optionValue.checked,
        isNew: true,
      });
    }
  };

  // set payment methods for radio list
  useEffect(() => {
    // guest user stuff
    if (skipPaymentMethodsQuery) {
      setNewPaymentMethod(first(paymentOptions));
      setLoadingSelectedPaymentMethod(false);
    } else {
      // logged in user stuff
      if (!loadingPaymentMethodsFromGraphQL && !isEmpty(paymentOptions)) {
        setNewPaymentMethod(first(paymentOptions));
        setLoadingSelectedPaymentMethod(false);
      }
    }
  }, [paymentOptions]);

  // set selected payment method in steps progress bar
  useEffect(() => {
    onChange({ stepPayment: paymentObject });
  }, [paymentObject]);

  return (
    <Container width={1} border={['1px solid #DCDEE0', 'none']} borderRadius={15}>
      {loadingSelectedPaymentMethod ? (
        <Loading />
      ) : paymentMethodsError ? (
        <MessageBox type="warning" withIcon>
          {intl.formatMessage(messages[paymentMethodsError.messageId], {
            collective: (
              <Link route="new-donate" params={{ collectiveSlug: stepProfile.slug, verb: 'new-donate' }}>
                {stepProfile.name}
              </Link>
            ),
          })}
        </MessageBox>
      ) : (
        <StyledRadioList
          id="PaymentMethod"
          name="PaymentMethod"
          keyGetter="key"
          options={paymentOptions}
          onChange={setNewPaymentMethod}
          value={stepPayment?.key}
        >
          {({ radio, checked, index, value }) => (
            <PaymentMethodBox
              minheight={50}
              py={3}
              bg="white.full"
              px={3}
              borderTop={!index ? 'none' : '1px solid'}
              borderColor="black.200"
              cursor={value.disabled ? 'not-allowed' : 'pointer'}
            >
              <Flex alignItems="center" css={value.disabled ? 'filter: grayscale(1) opacity(50%);' : undefined}>
                <Box as="span" mr={3} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex mr={3} css={{ flexBasis: '26px' }}>
                  {value.icon}
                </Flex>
                <Flex flexDirection="column">
                  <P fontSize="15px" lineHeight="20px" fontWeight={400} color="black.900">
                    {value.title}
                  </P>
                  {value.subtitle && (
                    <P fontSize="12px" fontWeight={400} lineHeight="18px" color="black.500">
                      {value.subtitle}
                    </P>
                  )}
                </Flex>
              </Flex>
              {value.key === 'newCreditCard' && checked && (
                <Box my={3}>
                  <NewCreditCardForm
                    name="newCreditCardInfo"
                    profileType={get(stepProfile, 'type')}
                    onChange={setNewPaymentMethod}
                    hidePostalCode={hideCreditCardPostalCode}
                  />
                </Box>
              )}
              {value.key === 'manual' && checked && value.instructions && (
                <Box my={3} color="black.600" fontSize="14px">
                  {value.instructions}
                </Box>
              )}
            </PaymentMethodBox>
          )}
        </StyledRadioList>
      )}
    </Container>
  );
};

NewContributionFlowStepPayment.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
  collective: PropTypes.object,
  stepDetails: PropTypes.object,
  stepPayment: PropTypes.object,
  stepProfile: PropTypes.object,
  onChange: PropTypes.func,
  loadStripe: PropTypes.func,
  hideCreditCardPostalCode: PropTypes.bool,
};

NewContributionFlowStepPayment.defaultProps = {
  hideCreditCardPostalCode: false,
};

export default withStripeLoader(withUser(NewContributionFlowStepPayment));
