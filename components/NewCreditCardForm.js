import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CardElement } from '@stripe/react-stripe-js';
import { Question } from '@styled-icons/octicons/Question';
import { isUndefined } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { GQLV2_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';

import { Flex } from './Grid';
import { getI18nLink } from './I18nFormatters';
import StyledCheckbox from './StyledCheckbox';
import StyledTooltip from './StyledTooltip';
import { Span } from './Text';

const StyledCardElement = styled(CardElement)`
  min-width: 200px;
  max-width: 450px;
  max-height: 55px;
  margin: 0px;
  border-width: 1px;
  border-style: solid;
  border-color: rgb(204, 204, 204);
  border-image: initial;
  padding: 1rem;
  border-radius: 3px;
`;

StyledCardElement.defaultProps = {
  style: { base: { fontSize: '14px', color: '#313233' } },
};

function NewCreditCardForm(props) {
  const [value, setValue] = useState(null);
  const [showAllErrors, setShowAllErrors] = useState(false);

  useEffect(() => {
    props.onChange(value);
  }, [value]);

  const onCheckboxChange = e => {
    if (props.useLegacyCallback) {
      props.onChange(e);
    } else {
      setValue(prevValue => ({ ...prevValue, isSavedForLater: e.checked }));
    }
  };

  const onCardChange = e => {
    const { useLegacyCallback, onChange, defaultIsSaved } = props;
    setShowAllErrors(false);
    if (useLegacyCallback) {
      onChange({ name, type: 'StripeCreditCard', value: e });
    } else {
      setValue(prevValue => ({
        ...prevValue,
        type: GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD,
        isSavedForLater: isUndefined(prevValue?.isSavedForLater) || prevValue.isSavedForLater ? defaultIsSaved : false,
        stripeData: e,
      }));
    }
  };

  const getError = () => {
    if (props.error) {
      return props.error;
    } else if (showAllErrors && value?.stripeData) {
      const { stripeData } = value;
      if (!stripeData.complete) {
        if (!props.hidePostalCode && !stripeData.value?.postalCode) {
          return (
            <FormattedMessage
              id="NewCreditCardForm.PostalCode"
              defaultMessage="Credit card zip/postal code is required"
            />
          );
        }
      }
    }
  };

  const { hasSaveCheckBox, hidePostalCode, defaultIsSaved } = props;
  const error = getError();
  return (
    <Flex flexDirection="column">
      <StyledCardElement
        hidePostalCode={hidePostalCode}
        onReady={input => input.focus()}
        onChange={onCardChange}
        onBlur={() => setShowAllErrors(true)}
      />
      {error && (
        <Span display="block" color="red.500" pt={2} fontSize="10px">
          {error}
        </Span>
      )}
      {hasSaveCheckBox && (
        <Flex mt={3} alignItems="center" color="black.700">
          <StyledCheckbox
            defaultChecked={defaultIsSaved}
            name="save"
            onChange={onCheckboxChange}
            label={<FormattedMessage id="paymentMethod.save" defaultMessage="Remember this payment method" />}
          />
          &nbsp;&nbsp;
          <StyledTooltip
            content={() => (
              <Span fontWeight="normal">
                <FormattedMessage
                  id="ContributeFAQ.Safe"
                  defaultMessage="Open Collective doesn't store credit card numbers, instead relying on our payment processor, Stripe, a secure solution that is widely adopted. If our systems are compromised, your credit card information is not at risk, because we simply don't store it. <LearnMoreLink>Learn more</LearnMoreLink>."
                  values={{
                    LearnMoreLink: getI18nLink({
                      openInNewTab: true,
                      href: 'https://docs.opencollective.com/help/product/security#payments-security',
                    }),
                  }}
                />
              </Span>
            )}
          >
            <Question size="1.1em" />
          </StyledTooltip>
        </Flex>
      )}
    </Flex>
  );
}

NewCreditCardForm.propTypes = {
  intl: PropTypes.object.isRequired,
  name: PropTypes.string,
  profileType: PropTypes.string, // USER or ORGANIZATION
  error: PropTypes.string,
  hasSaveCheckBox: PropTypes.bool,
  hidePostalCode: PropTypes.bool,
  onChange: PropTypes.func,
  onReady: PropTypes.func,
  useLegacyCallback: PropTypes.bool,
  defaultIsSaved: PropTypes.bool,
};

NewCreditCardForm.defaultProps = {
  hasSaveCheckBox: true,
  hidePostalCode: false,
  defaultIsSaved: true,
};

export default injectIntl(NewCreditCardForm);
