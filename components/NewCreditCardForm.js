import React from 'react';
import PropTypes from 'prop-types';
import { CardElement, ElementsConsumer } from '@stripe/react-stripe-js';
import { isUndefined } from 'lodash';
import { HelpCircle } from 'lucide-react';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../lib/constants/payment-methods';

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
  padding: 0.65rem;
  border-radius: 3px;
`;

StyledCardElement.defaultProps = {
  style: { base: { fontSize: '14px', color: '#313233' } },
};

class NewCreditCardFormWithoutStripe extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    name: PropTypes.string,
    error: PropTypes.string,
    hasSaveCheckBox: PropTypes.bool,
    hidePostalCode: PropTypes.bool,
    onChange: PropTypes.func,
    onReady: PropTypes.func,
    stripe: PropTypes.object,
    stripeElements: PropTypes.object,
    useLegacyCallback: PropTypes.bool,
    defaultIsSaved: PropTypes.bool,
  };

  static defaultProps = {
    hasSaveCheckBox: true,
    hidePostalCode: false,
    defaultIsSaved: true,
  };

  state = { value: null, showAllErrors: false };

  componentDidMount() {
    if (this.props.onReady && this.props.stripe) {
      this.props.onReady({ stripe: this.props.stripe, stripeElements: this.props.stripeElements });
    }
  }

  componentDidUpdate(oldProps) {
    if (this.props.onReady && !oldProps.stripe && this.props.stripe) {
      this.props.onReady({ stripe: this.props.stripe, stripeElements: this.props.stripeElements });
    }
  }

  onCheckboxChange = e => {
    if (this.props.useLegacyCallback) {
      this.props.onChange(e);
    } else {
      this.setState(
        ({ value }) => ({ value: { ...value, isSavedForLater: e.checked } }),
        () => this.props.onChange(this.state.value),
      );
    }
  };

  onCardChange = e => {
    const { useLegacyCallback, onChange, defaultIsSaved } = this.props;
    this.setState({ showAllErrors: false });
    if (useLegacyCallback) {
      onChange({ name, type: 'StripeCreditCard', value: e });
    } else {
      this.setState(
        ({ value }) => ({
          value: {
            ...value,
            service: PAYMENT_METHOD_SERVICE.STRIPE,
            type: PAYMENT_METHOD_TYPE.CREDITCARD,
            isSavedForLater: isUndefined(value?.isSavedForLater) || value.isSavedForLater ? defaultIsSaved : false,
            stripeData: e,
          },
        }),
        () => onChange(this.state.value),
      );
    }
  };

  getError() {
    if (this.props.error) {
      return this.props.error;
    } else if (this.state.showAllErrors && this.state.value?.stripeData) {
      const { stripeData } = this.state.value;
      if (!stripeData.complete) {
        if (!this.props.hidePostalCode && !stripeData.value?.postalCode) {
          return (
            <FormattedMessage
              id="NewCreditCardForm.PostalCode"
              defaultMessage="Credit card ZIP code and CVC are required"
            />
          );
        }
      }
    }
  }

  render() {
    const { hasSaveCheckBox, hidePostalCode, defaultIsSaved } = this.props;
    const error = this.getError();
    return (
      <Flex flexDirection="column">
        <StyledCardElement
          options={{ hidePostalCode }}
          onReady={input => input.focus()}
          onChange={this.onCardChange}
          onBlur={() => this.setState({ showAllErrors: true })}
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
              onChange={this.onCheckboxChange}
              label={<FormattedMessage id="paymentMethod.save" defaultMessage="Remember this payment method" />}
            />
            &nbsp;&nbsp;
            <StyledTooltip
              content={() => (
                <Span fontWeight="normal">
                  <FormattedMessage
                    id="ContributeFAQ.Safe"
                    defaultMessage="Open Collective doesn't store sensitive payment data (e.g. Credit Card numbers), instead relying on our payment processor, Stripe, a secure solution that is widely adopted. If our systems are compromised, your payment information is not at risk, because we simply don't store it. <LearnMoreLink>Learn more</LearnMoreLink>."
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
              <HelpCircle size="1.1em" />
            </StyledTooltip>
          </Flex>
        )}
      </Flex>
    );
  }
}

const NewCreditCardForm = props => (
  <ElementsConsumer>
    {({ stripe, elements }) => <NewCreditCardFormWithoutStripe stripe={stripe} stripeElements={elements} {...props} />}
  </ElementsConsumer>
);

NewCreditCardForm.propTypes = {
  intl: PropTypes.object,
  useLegacyCallback: PropTypes.bool,
};

NewCreditCardForm.defaultProps = {
  useLegacyCallback: true,
};

export default injectIntl(NewCreditCardForm);
