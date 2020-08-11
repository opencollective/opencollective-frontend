import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { CardElement, Elements, injectStripe } from 'react-stripe-elements';
import styled from 'styled-components';

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
  };

  static defaultProps = {
    hasSaveCheckBox: true,
    hidePostalCode: false,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'creditcard.save': {
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

  render() {
    const { intl, name, profileType, onChange, error, hasSaveCheckBox, hidePostalCode } = this.props;
    return (
      <Flex flexDirection="column" data-cy="new-credit-card-form">
        <StyledCardElement
          hidePostalCode={hidePostalCode}
          onChange={value => onChange({ name, type: 'StripeCreditCard', value })}
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
              label={intl.formatMessage(this.messages['creditcard.save'], { type: (profileType || '').toLowerCase() })}
              onChange={onChange}
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
};

export default injectIntl(NewCreditCardForm);
