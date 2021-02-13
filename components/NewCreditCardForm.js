import React from 'react';
import PropTypes from 'prop-types';
import { Question } from '@styled-icons/octicons/Question';
import { isUndefined } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import { CardElement, Elements, injectStripe } from 'react-stripe-elements';
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

class NewCreditCardFormWithoutStripe extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    name: PropTypes.string,
    profileType: PropTypes.string, // USER or ORGANIZATION
    error: PropTypes.string,
    hasSaveCheckBox: PropTypes.bool,
    hidePostalCode: PropTypes.bool,
    onChange: PropTypes.func,
    onReady: PropTypes.func,
    stripe: PropTypes.object,
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
      this.props.onReady({ stripe: this.props.stripe });
    }
  }

  componentDidUpdate(oldProps) {
    if (this.props.onReady && !oldProps.stripe && this.props.stripe) {
      this.props.onReady({ stripe: this.props.stripe });
    }
  }

  getProfileType = () => {
    const { profileType } = this.props;
    if (!profileType) {
      return '';
    } else if (profileType === 'INDIVIDUAL') {
      return 'user';
    } else {
      return profileType.toLowerCase();
    }
  };

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
            type: GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD,
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
              defaultMessage="Credit card zip/postal code is required"
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
          hidePostalCode={hidePostalCode}
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
}

const NewCreditCardFormWithStripe = injectStripe(NewCreditCardFormWithoutStripe);

const NewCreditCardForm = props => (
  <Elements locale={props.intl.locale || 'en'}>
    <NewCreditCardFormWithStripe {...props} />
  </Elements>
);

NewCreditCardForm.propTypes = {
  intl: PropTypes.object,
  useLegacyCallback: PropTypes.bool,
};

NewCreditCardForm.defaultProps = {
  useLegacyCallback: true,
};

export default injectIntl(NewCreditCardForm);
