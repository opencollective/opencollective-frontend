import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import themeGet from '@styled-system/theme-get';
import { get, isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Container from '../../components/Container';
import { Box, Flex } from '../../components/Grid';
import Loading from '../../components/Loading';
import NewCreditCardForm from '../../components/NewCreditCardForm';
import StyledRadioList from '../../components/StyledRadioList';
import { P } from '../../components/Text';

import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';

import { generatePaymentMethodOptions, NEW_CREDIT_CARD_KEY } from './utils';

const PaymentMethodBox = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  padding: 16px;

  ${props =>
    props.index &&
    css`
      border-top: 1px solid ${themeGet('colors.black.200')};
    `}

  ${props =>
    !props.disabled &&
    css`
      &:hover {
        background: ${themeGet('colors.black.50')};
      }
    `}
`;

const paymentMethodsQuery = gqlV2/* GraphQL */ `
  query ContributionFlowPaymentMethods($slug: String) {
    account(slug: $slug) {
      id
      paymentMethods(types: ["creditcard", "virtualcard", "prepaid", "collective"], includeExpired: true) {
        id
        name
        data
        type
        expiryDate
        providerType
        sourcePaymentMethod {
          id
          providerType
        }
        balance {
          valueInCents
          currency
        }
        account {
          id
          slug
          type
          name
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

const StepPayment = ({
  stepDetails,
  stepProfile,
  stepPayment,
  stepSummary,
  collective,
  onChange,
  hideCreditCardPostalCode,
  onNewCardFormReady,
}) => {
  // GraphQL mutations and queries
  const { loading, data, error } = useQuery(paymentMethodsQuery, {
    variables: { slug: stepProfile.slug },
    context: API_V2_CONTEXT,
    skip: !stepProfile.id,
    fetchPolicy: 'cache-and-network',
  });

  // data handling
  const paymentMethods = get(data, 'account.paymentMethods', null) || [];
  const paymentOptions = React.useMemo(
    () => generatePaymentMethodOptions(paymentMethods, stepProfile, stepDetails, stepSummary, collective),
    [paymentMethods, stepProfile, stepDetails, collective],
  );

  const setNewPaymentMethod = (key, paymentMethod) => {
    onChange({ stepPayment: { key, paymentMethod } });
  };

  // Set default payment method
  useEffect(() => {
    if (!loading && !stepPayment && !isEmpty(paymentOptions)) {
      const firstOption = paymentOptions.find(pm => !pm.disabled);
      if (firstOption) {
        setNewPaymentMethod(firstOption.key, firstOption.paymentMethod);
      }
    }
  }, [paymentOptions, stepPayment, loading]);

  return (
    <Container width={1} border={['1px solid #DCDEE0', 'none']} borderRadius={15}>
      {loading && !paymentMethods.length ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !paymentOptions.length ? (
        <MessageBox type="warning" withIcon>
          <FormattedMessage
            id="NewContribute.noPaymentMethodsAvailable"
            defaultMessage="There are no payment methods available."
          />
        </MessageBox>
      ) : (
        <StyledRadioList
          id="PaymentMethod"
          name="PaymentMethod"
          keyGetter="key"
          options={paymentOptions}
          onChange={option => setNewPaymentMethod(option.key, option.value.paymentMethod)}
          value={stepPayment?.key || null}
        >
          {({ radio, checked, index, value }) => (
            <PaymentMethodBox index={index} disabled={value.disabled}>
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
              {value.key === NEW_CREDIT_CARD_KEY && checked && (
                <Box my={3}>
                  <NewCreditCardForm
                    name={NEW_CREDIT_CARD_KEY}
                    profileType={get(stepProfile, 'type')}
                    hidePostalCode={hideCreditCardPostalCode}
                    onReady={onNewCardFormReady}
                    useLegacyCallback={false}
                    onChange={paymentMethod => setNewPaymentMethod(NEW_CREDIT_CARD_KEY, paymentMethod)}
                    error={get(stepPayment, 'paymentMethod.stripeData.error.message')}
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

StepPayment.propTypes = {
  collective: PropTypes.object,
  stepDetails: PropTypes.object,
  stepPayment: PropTypes.object,
  stepProfile: PropTypes.object,
  stepSummary: PropTypes.object,
  onChange: PropTypes.func,
  onNewCardFormReady: PropTypes.func,
  hideCreditCardPostalCode: PropTypes.bool,
};

StepPayment.defaultProps = {
  hideCreditCardPostalCode: false,
};

export default StepPayment;
