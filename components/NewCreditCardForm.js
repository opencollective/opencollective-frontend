import React from 'react';
import PropTypes from 'prop-types';
import { isUndefined } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { CardElement, Elements, injectStripe } from 'react-stripe-elements';
import styled from 'styled-components';

import { GQLV2_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';

import { Flex } from './Grid';
import StyledCheckbox from './StyledCheckbox';
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
  };

  static defaultProps = {
    hasSaveCheckBox: true,
    hidePostalCode: false,
  };

  constructor(props) {
    super(props);
    this.state = { value: null };
    this.messages = defineMessages({
      save: {
        id: 'creditcard.save',
        defaultMessage: 'Save credit card to {type, select, user {my account} other {{type} account}}',
      },
    });
  }

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
    if (this.props.useLegacyCallback) {
      this.props.onChange({ name, type: 'StripeCreditCard', value: e });
    } else {
      this.setState(
        ({ value }) => ({
          value: {
            ...value,
            type: GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD,
            isSavedForLater: isUndefined(value?.isSavedForLater) || value.isSavedForLater ? true : false,
            stripeData: e,
          },
        }),
        () => this.props.onChange(this.state.value),
      );
    }
  };

  render() {
    const { intl, error, hasSaveCheckBox, hidePostalCode } = this.props;
    return (
      <Flex flexDirection="column">
        <StyledCardElement
          hidePostalCode={hidePostalCode}
          onChange={this.onCardChange}
          onReady={input => input.focus()}
        />
        {error && (
          <Span display="block" color="red.500" pt={2} fontSize="10px">
            {error}
          </Span>
        )}
        {hasSaveCheckBox && (
          <Flex mt={3} alignItems="center">
            <StyledCheckbox
              defaultChecked
              name="save"
              label={intl.formatMessage(this.messages.save, { type: this.getProfileType() })}
              onChange={this.onCheckboxChange}
            />
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
