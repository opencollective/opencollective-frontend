import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { uniqBy, get } from 'lodash';

import { MoneyCheck } from '@styled-icons/fa-solid/MoneyCheck';
import { ExchangeAlt } from '@styled-icons/fa-solid/ExchangeAlt';

import { withStripeLoader } from '../StripeProvider';
import Container from '../Container';
import Link from '../Link';
import { P } from '../Text';
import StyledCard from '../StyledCard';
import MessageBox from '../MessageBox';
import StyledRadioList from '../StyledRadioList';
import { getPaymentMethodName, paymentMethodExpiration } from '../../lib/payment_method_label';
import { CollectiveType } from '../../lib/constants/collectives';
import { formatCurrency } from '../../lib/utils';

import CreditCard from '../icons/CreditCard';
import GiftCard from '../icons/GiftCard';
import PayPal from '../icons/PayPal';
import CreditCardInactive from '../icons/CreditCardInactive';
import Avatar from '../Avatar';
import NewCreditCardForm from '../NewCreditCardForm';
import StyledTag from '../StyledTag';

const PaymentEntryContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  background: ${themeGet('colors.white.full')};
  &:hover {
    background: ${themeGet('colors.black.50')};
  }
`;

const minBalance = 50; // Minimum usable balance for virtual card

const getPaymentMethodIcon = (pm, collective) => {
  if (pm.type === 'creditcard') {
    return <CreditCard />;
  } else if (pm.type === 'virtualcard') {
    return <GiftCard />;
  } else if (pm.service === 'paypal') {
    return <PayPal />;
  } else if (pm.type === 'prepaid') {
    return <MoneyCheck width="26px" height="18px" />;
  } else if (pm.type === 'collective' && collective) {
    return <Avatar collective={collective} size="3.6rem" />;
  } else if (pm.type === 'manual') {
    return <ExchangeAlt size="1.5em" color="#c9ced4" />;
  }
};

/** Returns payment method's subtitles */
const getPaymentMethodMetadata = pm => {
  if (pm.type === 'creditcard') {
    const expiryDate = paymentMethodExpiration(pm);
    return (
      <FormattedMessage
        id="ContributePayment.expiresOn"
        defaultMessage="Expires on {expiryDate}"
        values={{ expiryDate }}
      />
    );
  } else if (pm.type === 'virtualcard') {
    if (pm.balance < minBalance) {
      return (
        <FormattedMessage
          id="ContributePayment.unusableBalance"
          defaultMessage="{balance} left, balance less than {minBalance} cannot be used."
          values={{
            balance: formatCurrency(pm.balance, pm.currency),
            minBalance: formatCurrency(minBalance, pm.currency),
          }}
        />
      );
    } else if (pm.expiryDate && paymentMethodExpired(pm.expiryDate)) {
      return (
        <FormattedMessage
          id="ContributePayment.expiredOn"
          defaultMessage="Expired on {expiryDate}"
          values={{
            expiryDate: <FormattedDate value={pm.expiryDate} day="numeric" month="long" year="numeric" />,
          }}
        />
      );
    } else if (pm.expiryDate) {
      return (
        <FormattedMessage
          id="ContributePayment.balanceAndExpiry"
          defaultMessage="{balance} left, expires on {expiryDate}"
          values={{
            expiryDate: <FormattedDate value={pm.expiryDate} day="numeric" month="long" year="numeric" />,
            balance: formatCurrency(pm.balance, pm.currency),
          }}
        />
      );
    } else {
      return (
        <FormattedMessage
          id="ContributePayment.balanceLeft"
          defaultMessage="{balance} left"
          values={{ balance: formatCurrency(pm.balance, pm.currency) }}
        />
      );
    }
  } else if (['prepaid', 'collective'].includes(pm.type)) {
    return (
      <FormattedMessage
        id="ContributePayment.balanceLeft"
        defaultMessage="{balance} left"
        values={{ balance: formatCurrency(pm.balance, pm.currency) }}
      />
    );
  }
};

/**
 * Returns true is a payment method is expired
 * @param {string} expiryDate
 */
const paymentMethodExpired = expiryDate => expiryDate && new Date(expiryDate) < new Date();

/**
 * A radio list to select a payment method.
 */
class StepPayment extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
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
    if (this.props.onChange && selectedOption) {
      const isNew = selectedOption.key === 'newCreditCard';
      this.props.onChange({
        paymentMethod: selectedOption.paymentMethod,
        data: newCreditCardInfo,
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

      return { selectedOption, save, errors };
    });
  }

  generatePaymentsOptions() {
    const { collective, defaultValue, withPaypal, manual } = this.props;
    // Add collective payment methods
    const paymentMethodsOptions = (collective.paymentMethods || []).map(pm => {
      const isExpired = paymentMethodExpired(pm.expiryDate);
      return {
        key: `pm-${pm.id}`,
        title: getPaymentMethodName(pm),
        subtitle: getPaymentMethodMetadata(pm),
        icon: getPaymentMethodIcon(pm, collective),
        paymentMethod: pm,
        isExpired,
        disabled: pm.balance < minBalance || isExpired,
      };
    });

    // Add other PMs types (new credit card, bank transfer...etc) if collective is not a `COLLECTIVE`
    if (collective.type !== CollectiveType.COLLECTIVE) {
      // New credit card
      paymentMethodsOptions.push({
        key: 'newCreditCard',
        title: <FormattedMessage id="contribute.newcreditcard" defaultMessage="New credit/debit card" />,
        icon: <CreditCardInactive />,
        paymentMethod: { type: 'creditcard', service: 'stripe' },
      });

      // Paypal
      if (withPaypal) {
        paymentMethodsOptions.push({
          key: 'paypal',
          title: 'PayPal',
          paymentMethod: { service: 'paypal', type: 'payment' },
          icon: getPaymentMethodIcon({ service: 'paypal', type: 'payment' }, collective),
        });
      }

      // Manual (bank transfer)
      if (manual) {
        paymentMethodsOptions.push({
          key: 'manual',
          title: this.props.manual.title || 'Bank transfer',
          paymentMethod: { type: 'manual' },
          icon: getPaymentMethodIcon({ type: 'manual' }, collective),
          data: this.props.manual,
          disabled: this.props.manual.disabled,
          subtitle: this.props.manual.subtitle,
        });
      }
    }

    // If we got a validated card then switched steps to come back here,
    // this will display the newly added card on the top.
    if (defaultValue && defaultValue.isNew && defaultValue.key !== 'newCreditCard') {
      paymentMethodsOptions.unshift({
        ...defaultValue,
        title: (
          <FormattedMessage
            id="contribute.newCard"
            defaultMessage="New: {name}"
            values={{ name: getPaymentMethodName(defaultValue.paymentMethod) }}
          />
        ),
        subtitle: getPaymentMethodMetadata(defaultValue.paymentMethod),
        icon: getPaymentMethodIcon(defaultValue.paymentMethod, collective),
      });
    }

    return uniqBy(paymentMethodsOptions, 'key');
  }

  getCursor(isDisabled, isSelected) {
    if (isDisabled) {
      return 'not-allowed';
    } else if (!isSelected) {
      return 'pointer';
    } else {
      return 'auto';
    }
  }

  render() {
    const { paymentMethodsOptions, errors, selectedOption } = this.state;

    // If there's no option selected, it means that there's no payment method for this
    // profile/collective. This can happens when trying to donate from a collective
    // that have a balance = 0.
    if (!selectedOption) {
      const { name, slug } = this.props.collective;
      return (
        <MessageBox type="warning" withIcon>
          <FormattedMessage
            id="contribute.noPaymentMethod"
            defaultMessage="The balance of this collective is too low to make orders from it. Add funds to {collectiveName} by making a donation to it first."
            values={{
              collectiveName: (
                <Link route="orderCollectiveNew" params={{ collectiveSlug: slug, verb: 'donate' }}>
                  {name}
                </Link>
              ),
            }}
          />
        </MessageBox>
      );
    }

    return (
      <StyledCard width={1} maxWidth={500} mx="auto">
        <StyledRadioList
          id="PaymentMethod"
          name="PaymentMethod"
          keyGetter="key"
          options={paymentMethodsOptions}
          onChange={this.onChange}
          defaultValue={selectedOption.key}
          disabled={this.props.disabled}
        >
          {({ radio, checked, index, value: { key, title, subtitle, icon, data, disabled, isExpired } }) => (
            <PaymentEntryContainer
              px={[3, 24]}
              py={3}
              borderBottom={index !== paymentMethodsOptions.length - 1 ? '1px solid' : 'none'}
              bg="white.full"
              borderColor="black.200"
              css={disabled ? 'filter: grayscale(1);' : undefined}
              cursor={this.getCursor(disabled || this.props.disabled, checked)}
            >
              <Flex alignItems="center">
                <Box as="span" mr={[2, 21]} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex mr={3} css={{ flexBasis: '26px' }}>
                  {icon}
                </Flex>
                <Flex flexDirection="column">
                  <div>
                    <P display="inline" fontWeight={subtitle ? 600 : 400} color="black.900" marginRight="10px">
                      {title}
                    </P>
                    {isExpired && (
                      <StyledTag display="inline">
                        <FormattedMessage id="contribute.paymentMethodExpired" defaultMessage="Expired" />
                      </StyledTag>
                    )}
                  </div>
                  {subtitle && (
                    <P fontSize="Caption" fontWeight={400} lineHeight="Caption" color="black.500">
                      {subtitle}
                    </P>
                  )}
                </Flex>
              </Flex>
              {key === 'newCreditCard' && checked && (
                <Box my={3}>
                  <NewCreditCardForm
                    name="newCreditCardInfo"
                    profileType={get(this.props.collective, 'type')}
                    error={errors.newCreditCardInfo}
                    onChange={this.onChange}
                    onReady={this.props.onNewCardFormReady}
                    hidePostalCode={this.props.hideCreditCardPostalCode}
                  />
                </Box>
              )}
              {key === 'manual' && checked && data.instructions && (
                <Box my={3} color="black.600" fontSize="Paragraph">
                  {data.instructions}
                </Box>
              )}
            </PaymentEntryContainer>
          )}
        </StyledRadioList>
      </StyledCard>
    );
  }
}

StepPayment.propTypes = {
  /** A collective to get payment methods from */
  collective: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    paymentMethods: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  /** Called when the payment method changes */
  onChange: PropTypes.func,
  /**
   * Wether PayPal should be enabled. Note that this component does not render
   * PayPal button - this is up to parent component to do it.
   */
  withPaypal: PropTypes.bool,
  /** Manual payment method instruction. Should be null if an interval is set */
  manual: PropTypes.shape({
    title: PropTypes.string,
    instructions: PropTypes.string,
    disabled: PropTypes.bool,
    subtitle: PropTypes.string,
  }),
  /** Default value */
  defaultValue: PropTypes.object,
  /** Called with an object like {stripe} when new card form is mounted */
  onNewCardFormReady: PropTypes.func,
  /** From withStripeLoader */
  loadStripe: PropTypes.func.isRequired,
  /**
   * Wether we should ask for postal code in Credit Card form
   */
  hideCreditCardPostalCode: PropTypes.bool,
  /** If true, user won't be able to interact with the element */
  disabled: PropTypes.bool,
};

StepPayment.defaultProps = {
  withPaypal: false,
  hideCreditCardPostalCode: false,
};

export default withStripeLoader(StepPayment);
