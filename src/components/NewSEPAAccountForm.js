import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Elements, IbanElement, injectStripe } from 'react-stripe-elements';
import { Flex } from '@rebass/grid';
import { debounce } from 'lodash';

import { Span } from './Text';
import StyledCheckbox from './StyledCheckbox';
import StyledInput from './StyledInput';

const StyledIbanElement = styled(IbanElement)`
  background: #fff;
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

StyledIbanElement.defaultProps = {
  style: { base: { fontSize: '14px', color: '#313233' } },
};

class NewSEPAAccountFormWithoutStripe extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    error: PropTypes.string,
    hasSaveCheckBox: PropTypes.bool,
    onChange: PropTypes.func,
    onReady: PropTypes.func,
    stripe: PropTypes.object,
  };

  static defaultProps = {
    hasSaveCheckBox: true,
  };

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = {
      bankName: undefined,
      complete: false,
      country: undefined,
      elementType: 'iban',
      tokenOptions: {
        currency: 'eur',
        account_holder_name: '',
      },
      empty: true,
      error: undefined,
      value: undefined,
    };
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

  dispatchChange = debounce(this.props.onChange, 500);

  onChange(e) {
    if (e.target && e.target.name === 'accountHolderName') {
      e.stopPropagation();
      const account_holder_name = e.target.value;
      this.setState(state => ({
        ...state,
        tokenOptions: {
          ...state.tokenOptions,
          account_holder_name,
        },
      }));
    } else {
      this.setState(state => ({ ...state, ...e }));
    }
    this.dispatchChange({ name: this.props.name, type: 'StripeIbanAccount', value: this.state });
  }

  render() {
    const { onChange, error, hasSaveCheckBox } = this.props;

    return (
      <Flex flexDirection="column">
        <Flex mb={2} as="label">
          <StyledInput
            name="accountHolderName"
            placeholder="Account holder name"
            width="100%"
            fontWeight="normal"
            onChange={this.onChange}
          />
        </Flex>
        <label>
          <StyledIbanElement
            onChange={this.onChange}
            supportedCountries={['SEPA']}
            placeholderCountry="FR"
            type="sepa_debit"
          />
        </label>
        {error && (
          <Span display="block" color="red.500" pt={2} fontSize="Tiny">
            {error}
          </Span>
        )}
        {hasSaveCheckBox && (
          <Flex mt={3} alignItems="center">
            <StyledCheckbox defaultChecked name="save" label="Save this IBAN to my account" onChange={onChange} />
          </Flex>
        )}
      </Flex>
    );
  }
}

const NewSEPAAccountFormWithStripe = injectStripe(NewSEPAAccountFormWithoutStripe);

const NewSEPAAccountForm = props => (
  <Elements>
    <NewSEPAAccountFormWithStripe {...props} />
  </Elements>
);

export default NewSEPAAccountForm;
