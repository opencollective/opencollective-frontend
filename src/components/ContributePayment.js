import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { Box, Flex } from '@rebass/grid';
import { Elements, CardElement, injectStripe } from 'react-stripe-elements';
import { FormattedMessage } from 'react-intl';
import { uniqBy, get } from 'lodash';

import { MoneyCheck } from 'styled-icons/fa-solid/MoneyCheck.cjs';

import { withStripeLoader } from './StripeProvider';
import Container from './Container';
import { P, Span } from './Text';
import StyledCard from './StyledCard';
import StyledRadioList from './StyledRadioList';
import { getPaymentMethodName, paymentMethodExpiration } from '../lib/payment_method_label';
import withIntl from '../lib/withIntl';
import { formatCurrency } from '../lib/utils';

import CreditCard from './icons/CreditCard';
import GiftCard from './icons/GiftCard';
import PayPal from './icons/PayPal';
import CreditCardInactive from './icons/CreditCardInactive';
import StyledCheckbox from './StyledCheckbox';
import Avatar from './Avatar';

const PaymentEntryContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background: ${themeGet('colors.white.full')};
  &:hover {
    background: ${themeGet('colors.black.50')};
  }
`;

const getPaymentMethodIcon = (pm, collective) => {
  if (pm.type === 'creditcard') {
    return <CreditCard />;
  } else if (pm.type === 'virtualcard') {
    return <GiftCard />;
  } else if (pm.type === 'paypal') {
    return <PayPal />;
  } else if (pm.type === 'prepaid') {
    return <MoneyCheck width="26px" height="18px" />;
  } else if (pm.type === 'collective' && collective) {
    const { image, type, name } = collective;
    return <Avatar src={image} type={type} size="3.6rem" name={name} />;
  }
};

const getPaymentMethodMetadata = pm => {
  const expiryDate = paymentMethodExpiration(pm);
  if (pm.type === 'creditcard') {
    return `Expires on ${expiryDate}`;
  } else if (pm.type === 'virtualcard') {
    const balanceLeft = `${formatCurrency(pm.balance, pm.balance.curency)} left`;
    if (expiryDate) {
      return `${balanceLeft}, expires on ${expiryDate}`;
    } else {
      return balanceLeft;
    }
  } else if (pm.type === 'prepaid') {
    return `${formatCurrency(pm.balance, pm.balance.curency)} left`;
  } else if (pm.type === 'collective') {
    return `${formatCurrency(pm.balance, pm.balance.curency)} available`;
  }
};

const StyledCardElement = styled(CardElement)`
  max-width: 350px;
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
    const { name, onChange, error } = this.props;
    return (
      <Flex flexDirection="column">
        <StyledCardElement onChange={value => onChange({ name, type: 'StripeCreditCard', value })} />
        {error && (
          <Span display="block" color="red.500" pt={2} fontSize="Tiny">
            {error}
          </Span>
        )}
        <Flex mt={3} alignItems="center">
          <StyledCheckbox defaultChecked name="save" label="Save this card to my account" onChange={onChange} />
        </Flex>
      </Flex>
    );
  }
}

const NewCreditCardForm = injectStripe(NewCreditCardFormWithoutStripe);

/**
 * A radio list to select a payment method.
 */
class ContributePayment extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.staticPaymentMethodsOptions = [
      {
        key: 'newCreditCard',
        title: <FormattedMessage id="contribute.newcreditcard" defaultMessage="New credit/debit card" />,
        icon: <CreditCardInactive />,
      },
    ];

    if (props.withPaypal) {
      this.staticPaymentMethodsOptions.push({
        key: 'paypal',
        title: 'PayPal',
        paymentMethod: 'paypal',
        icon: <PayPal />,
      });
    }

    const paymentMethodsOptions = this.generatePaymentsOptions();
    this.state = {
      paymentMethodsOptions: paymentMethodsOptions,
      selectedOption: props.defaultValue || paymentMethodsOptions[0],
      newCreditCardInfo: null,
      save: true,
      errors: {},
    };
  }

  componentDidMount() {
    // We load stripe script as soon as the component mount
    this.props.loadStripe();

    // Generate an onChange event with default value on first mount if no default provided
    if (!this.props.defaultValue) {
      this.dispatchChangeEvent(this.state.selectedOption);
    }
  }

  dispatchChangeEvent(selectedOption, newCreditCardInfo, save) {
    if (this.props.onChange) {
      const isNew = selectedOption.key === 'newCreditCard';
      this.props.onChange({
        paymentMethod: isNew ? newCreditCardInfo : selectedOption.paymentMethod,
        title: selectedOption.title,
        subtitle: selectedOption.subtitle,
        isNew,
        save,
        key: selectedOption.key,
        error: isNew && get(newCreditCardInfo, 'error'),
      });
    }
  }

  onChange(event) {
    const { name, value, checked } = event;
    this.setState(state => {
      const errors = state.errors;
      let selectedOption = state.selectedOption;
      let save = state.save;
      let newCreditCardInfo = state.newCreditCardInfo;

      if (name === 'PaymentMethod') {
        selectedOption = value;
      } else if (name === 'newCreditCardInfo') {
        newCreditCardInfo = value;
        if (value.error) {
          errors['newCreditCardInfo'] = value.error.message;
        } else {
          delete errors['newCreditCardInfo'];
        }
      } else if (name === 'save') {
        save = checked;
      }

      if (this.props.onChange) {
        this.dispatchChangeEvent(selectedOption, newCreditCardInfo, save);
      }

      return { ...state, selectedOption, save, errors };
    });
  }

  generatePaymentsOptions() {
    const { paymentMethods, collective } = this.props;
    const userPaymentMethods = uniqBy([...paymentMethods, ...get(collective, 'paymentMethods', [])], 'id');

    return [
      ...userPaymentMethods.map(pm => ({
        key: `pm-${pm.id}`,
        title: getPaymentMethodName(pm),
        subtitle: getPaymentMethodMetadata(pm),
        icon: getPaymentMethodIcon(pm, collective),
        paymentMethod: pm,
      })),
      ...this.staticPaymentMethodsOptions,
    ];
  }

  render() {
    const { paymentMethodsOptions, errors } = this.state;
    return (
      <StyledCard maxWidth={500}>
        <StyledRadioList
          id="PaymentMethod"
          name="PaymentMethod"
          keyGetter="key"
          options={paymentMethodsOptions}
          onChange={this.onChange}
          defaultValue={this.state.selectedOption.key}
        >
          {({ radio, checked, index, value: { key, title, subtitle, icon } }) => (
            <PaymentEntryContainer
              px={[3, 24]}
              py={3}
              borderBottom={index !== paymentMethodsOptions.length - 1 ? '1px solid' : 'none'}
              bg="white.full"
              borderColor="black.200"
            >
              <Flex alignItems="center">
                <Box as="span" mr={[2, 21]} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex mr={3} css={{ flexBasis: '26px' }}>
                  {icon}
                </Flex>
                <Flex flexDirection="column">
                  <P fontWeight={subtitle ? 600 : 400} color="black.900">
                    {title}
                  </P>
                  {subtitle && (
                    <P fontSize="Caption" fontWeight={400} lineHeight="Caption" color="black.500">
                      {subtitle}
                    </P>
                  )}
                </Flex>
              </Flex>
              {key === 'newCreditCard' && checked && (
                <Box my={3}>
                  <Elements>
                    <NewCreditCardForm
                      name="newCreditCardInfo"
                      error={errors.newCreditCardInfo}
                      onChange={this.onChange}
                      onReady={this.props.onNewCardFormReady}
                    />
                  </Elements>
                </Box>
              )}
            </PaymentEntryContainer>
          )}
        </StyledRadioList>
      </StyledCard>
    );
  }
}

ContributePayment.propTypes = {
  /** The payment methods to display */
  paymentMethods: PropTypes.arrayOf(PropTypes.object),
  /**
   * An optional collective to get payment methods from. If used at the same time as
   * `paymentMethods` it will merge both lists and filter uniques using their ids.
   */
  collective: PropTypes.object,
  /** Called when the payment method changes */
  onChange: PropTypes.func,
  /** Wether PayPal should be enabled */
  withPaypal: PropTypes.bool,
  /** Default value */
  defaultValue: PropTypes.object,
  /** Called with an object like {stripe} when new card form is mounted */
  onNewCardFormReady: PropTypes.func,
  /** From withStripeLoader */
  loadStripe: PropTypes.func.isRequired,
};

ContributePayment.defaultProps = {
  withPaypal: true,
  paymentMethods: [],
  collective: null,
};

export default withIntl(withStripeLoader(ContributePayment));
