import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { graphql } from 'react-apollo';

import { CheckCircle } from 'styled-icons/fa-regular/CheckCircle.cjs';
import { RadioButtonChecked } from 'styled-icons/material/RadioButtonChecked.cjs';
import { RadioButtonUnchecked } from 'styled-icons/material/RadioButtonUnchecked.cjs';

import { getCollectiveSourcePaymentMethodsQuery } from '../graphql/queries';
import { createVirtualCardsMutationQuery } from '../graphql/mutations';
import StyledInputAmount from './StyledInputAmount';
import StyledButton from './StyledButton';
import StyledPaymentMethodChooser from './StyledPaymentMethodChooser';
import Loading from './Loading';
import Link from './Link';
import StyledMultiEmailInput from './StyledMultiEmailInput';
import { P, H3 } from './Text';
import StyledInput from './StyledInput';
import InputField from './InputField';

const MIN_AMOUNT = 5;
const MAX_AMOUNT = 10000;

const InlineField = ({ name, children, label, isLabelClickable }) => (
  <Flex flexWrap="wrap" alignItems="center" mb="2.5em" className={`field-${name}`}>
    <Box css={{ flexBasis: '12em' }}>
      <label htmlFor={`virtualcard-${name}`} style={isLabelClickable && { cursor: 'pointer' }}>
        {label}
      </label>
    </Box>
    {children}
  </Flex>
);

const DeliverTypeRadioSelector = styled(Flex)`
  justify-content: space-evenly;
  padding: 1.25em 1em;
  margin-bottom: 2.5em;
  background: white;
  box-shadow: 0px 3px 10px ${themeGet('colors.black.200')};
  border-top: 1px solid ${themeGet('colors.black.200')};
  border-bottom: 1px solid ${themeGet('colors.black.200')};
`;

const RadioButtonContainer = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: auto;
  svg {
    height: 30px;
    width: 30px;
    color: ${themeGet('colors.primary.400')};
    transition: color 0.2s;
    &:hover {
      color: ${themeGet('colors.primary.500')};
    }
  }
`;

const RadioButtonWithLabel = ({ checked, onClick, name, children }) => {
  const icon = checked ? <RadioButtonChecked /> : <RadioButtonUnchecked />;
  return (
    <RadioButtonContainer data-name={name} onClick={onClick}>
      <Box className="radio-btn">{icon}</Box>
      <H3 textAlign="center" px={2}>
        {children}
      </H3>
    </RadioButtonContainer>
  );
};

const FieldLabelDetails = styled.span`
  color: ${themeGet('colors.black.400')};
  font-weight: 400;
`;

const RedeemLinksTextarea = styled.textarea`
  max-width: 450px;
  height: 175px;
  resize: vertical;
  width: 95%;
  overflow-wrap: normal;
`;

class CreateVirtualCardsForm extends Component {
  static propTypes = {
    collectiveId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    createVirtualCards: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.form = React.createRef();
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      deliverType: 'email', // email or manual
      values: { amount: '', onlyOpensource: true, emails: [], customMessage: '', numberOfVirtualCards: 1 },
      errors: { emails: [] },
      multiEmailsInitialState: null,
      submitting: false,
      createdVirtualCards: null,
      serverError: null,
    };
  }

  onChange(fieldName, value) {
    if (fieldName === 'emails') {
      const { emails, invalids } = value;
      this.setState(state => ({
        ...state,
        values: { ...state.values, emails },
        errors: { ...state.errors, emails: invalids },
      }));
    } else if (fieldName === 'numberOfVirtualCards') {
      const intnumberOfVirtualCards = parseInt(value);
      if (!isNaN(intnumberOfVirtualCards)) {
        this.setState(state => ({
          ...state,
          values: { ...state.values, numberOfVirtualCards: intnumberOfVirtualCards },
        }));
      } else if (this.state.values.numberOfVirtualCards === undefined) {
        this.setState(state => ({ ...state, values: { ...state.values, numberOfVirtualCards: 1 } }));
      }
    } else if (fieldName === 'amount') {
      const intAmount = parseInt(value);
      if (!isNaN(intAmount)) {
        this.setState(state => ({ ...state, values: { ...state.values, amount: intAmount } }));
      } else if (this.state.values.amount === undefined) {
        this.setState(state => ({ ...state, values: { ...state.values, amount: MIN_AMOUNT } }));
      }
    } else if (fieldName === 'paymentMethod') {
      this.setState(state => ({ ...state, values: { ...state.values, PaymentMethodId: value.value.id } }));
    } else if (fieldName === 'onlyOpensource') {
      this.setState(state => ({ ...state, values: { ...state.values, onlyOpensource: value } }));
    } else if (fieldName === 'customMessage') {
      this.setState(state => ({ ...state, values: { ...state.values, customMessage: value } }));
    }
  }

  isSubmitEnabled() {
    // Others fields validity are checked with HTML5 validation (see `onSubmit`)
    const { values, errors, deliverType } = this.state;

    if (deliverType === 'email') {
      return values.emails.length > 0 && errors.emails.length == 0;
    } else {
      return values.numberOfVirtualCards !== 0;
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const { values, submitting, deliverType } = this.state;
    if (!submitting && this.form.current.reportValidity()) {
      this.setState({ submitting: true });
      const params = {
        amount: values.amount * 100,
        PaymentMethodId: values.PaymentMethodId || this.getDefaultPaymentMethod().id,
        limitedToOpenSourceCollectives: values.onlyOpensource,
      };

      if (deliverType === 'email') {
        params.emails = values.emails;
        params.customMessage = values.customMessage;
      } else if (deliverType === 'manual') {
        params.numberOfVirtualCards = values.numberOfVirtualCards;
      }

      this.props
        .createVirtualCards(params)
        .then(({ data }) => {
          this.setState({ createdVirtualCards: data.createVirtualCards, submitting: false });
        })
        .catch(e => {
          this.setState({ serverError: e.message, submitting: false });
        });
    }
  }

  getDefaultPaymentMethod() {
    return get(this.props, 'data.Collective.paymentMethods', [])[0];
  }

  getError(fieldName) {
    return this.state.errors[fieldName];
  }

  changeDeliverType(deliverType) {
    this.setState(state => {
      // Use the emails count to pre-fill the number count
      const values = { ...state.values };
      if (state.deliverType === 'email' && deliverType === 'manual' && values.emails.length) {
        values.numberOfVirtualCards = values.emails.length;
      }
      return { ...state, values, deliverType };
    });
  }

  renderSubmit() {
    const { submitting, values, deliverType } = this.state;
    const count = deliverType === 'email' ? values.emails.length : values.numberOfVirtualCards;
    const enable = this.isSubmitEnabled();
    return (
      <StyledButton
        type="submit"
        buttonSize="large"
        buttonStyle="primary"
        minWidth="16em"
        disabled={!submitting && !enable}
        loading={submitting}
      >
        <FormattedMessage id="virtualCards.generate" defaultMessage="Create {count} gift cards" values={{ count }} />
      </StyledButton>
    );
  }

  renderNoPaymentMethodMessage() {
    return (
      <Flex justifyContent="center">
        <Link route="editCollective" params={{ slug: this.props.collectiveSlug, section: 'payment-methods' }}>
          <StyledButton buttonSize="large" mt="2em" justifyContent="center">
            <FormattedMessage
              id="virtualCards.create.requirePM"
              defaultMessage="You must add a payment method to your account to create gift cards"
            />
          </StyledButton>
        </Link>
      </Flex>
    );
  }

  renderSuccess() {
    const { deliverType, createdVirtualCards } = this.state;
    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        <P color="green.700">
          <CheckCircle size="3em" />
        </P>
        {deliverType === 'email' && (
          <FormattedMessage
            id="virtualCards.create.successSent"
            defaultMessage="Your {count} gift cards have been sent! Go back to the {link} to see them."
            values={{
              count: createdVirtualCards.length,
              link: (
                <Link route="editCollective" params={{ slug: this.props.collectiveSlug, section: 'gift-cards' }}>
                  <FormattedMessage id="virtualcards.create.listPage" defaultMessage="gift cards list" />
                </Link>
              ),
            }}
          />
        )}
        {deliverType === 'manual' && (
          <React.Fragment>
            <Box mb="1em">
              <FormattedMessage
                id="virtualCards.create.successCreate"
                defaultMessage="Your {count} gift cards have been created! Here are your redeem links:"
                values={{ count: createdVirtualCards.length }}
              />
            </Box>
            <RedeemLinksTextarea
              className="result-redeem-links"
              readOnly
              value={createdVirtualCards
                .map(vc => {
                  const code = vc.uuid.split('-')[0];
                  return `${process.env.WEBSITE_URL}/redeem/${code}`;
                })
                .join('\n')}
            />
          </React.Fragment>
        )}
      </Flex>
    );
  }

  renderEmailFields() {
    const { submitting, errors, multiEmailsInitialState } = this.state;
    return (
      <Box>
        <Flex flexDirection="column" mb="2em">
          <label style={{ width: '100%' }}>
            <Flex flexDirection="column">
              <FormattedMessage id="virtualCards.create.recipients" defaultMessage="Recipients" />
              <FieldLabelDetails>
                <FormattedMessage
                  id="virtualCards.create.recipientsDetails"
                  defaultMessage="A list of emails that will receive a gift card"
                />
              </FieldLabelDetails>
            </Flex>
          </label>
          <StyledMultiEmailInput
            className="virtualcards-recipients"
            mt="0.25em"
            invalids={errors.emails}
            initialState={multiEmailsInitialState}
            onClose={s => this.setState({ multiEmailsInitialState: s })}
            onChange={value => this.onChange('emails', value)}
            disabled={submitting}
          />
        </Flex>
        <InlineField
          name="customMessage"
          label={
            <Flex flexDirection="column">
              <FormattedMessage id="virtualCards.create.customMessage" defaultMessage="Custom message" />
              <FieldLabelDetails>
                <FormattedMessage id="forms.optional" defaultMessage="Optional" />
              </FieldLabelDetails>
            </Flex>
          }
        >
          <StyledInput
            id="virtualcard-customMessage"
            type="text"
            maxLength="255"
            placeholder="Will be sent in the invitation email"
            onChange={e => this.onChange('customMessage', e.target.value)}
            style={{ flexGrow: 1 }}
            disabled={submitting}
          />
        </InlineField>
      </Box>
    );
  }

  renderManualFields() {
    return (
      <Flex justifyContent="center" mb="2em">
        <H3 mr="1em">
          <FormattedMessage id="virtualCards.create.number" defaultMessage="Number of gift cards" />
        </H3>
        <StyledInput
          id="virtualcard-numberOfVirtualCards"
          type="number"
          step="1"
          min="1"
          max="100"
          maxWidth="6.5em"
          onChange={e => this.onChange('numberOfVirtualCards', e.target.value)}
          value={this.state.values.numberOfVirtualCards}
          disabled={this.state.submitting}
        />
      </Flex>
    );
  }

  render() {
    const loading = get(this.props, 'data.loading');
    const paymentMethods = get(this.props, 'data.Collective.paymentMethods', []);

    if (loading) return <Loading />;
    if (paymentMethods.length === 0) return this.renderNoPaymentMethodMessage();

    const { submitting, values, createdVirtualCards, serverError, deliverType } = this.state;

    return createdVirtualCards ? (
      this.renderSuccess()
    ) : (
      <form ref={this.form} onSubmit={this.onSubmit}>
        <Flex flexDirection="column">
          <InlineField
            name="amount"
            label={<FormattedMessage id="virtualCards.create.amount" defaultMessage="Amount" />}
          >
            <StyledInputAmount
              id="virtualcard-amount"
              currency={this.props.currency}
              onChange={e => this.onChange('amount', e.target.value)}
              error={this.getError('amount')}
              value={values.amount}
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              disabled={submitting}
              required
            />
          </InlineField>

          <InlineField
            name="paymentMethod"
            label={<FormattedMessage id="virtualCards.create.paymentMethod" defaultMessage="Payment Method" />}
          >
            <StyledPaymentMethodChooser
              disabled={submitting}
              paymentMethods={paymentMethods}
              defaultPaymentMethod={this.getDefaultPaymentMethod()}
              onChange={option => this.onChange('paymentMethod', option)}
            />
          </InlineField>

          <InlineField
            name="onlyOpensource"
            isLabelClickable
            label={
              <FormattedMessage
                id="virtualCards.create.onlyOpensource"
                defaultMessage="Limit to opensource collectives"
              />
            }
          >
            <InputField
              id="virtualcard-onlyOpensource"
              name="onlyOpensource"
              defaultValue={values.onlyOpensource}
              onChange={value => this.onChange('onlyOpensource', value)}
              type="switch"
            />
          </InlineField>

          <DeliverTypeRadioSelector className="deliver-type-selector">
            <RadioButtonWithLabel
              name="email"
              checked={deliverType === 'email'}
              onClick={() => this.changeDeliverType('email')}
            >
              <FormattedMessage id="virtualCards.create.sendEmails" defaultMessage="Send the cards by&#160;email" />
            </RadioButtonWithLabel>
            <RadioButtonWithLabel
              name="manual"
              checked={deliverType === 'manual'}
              onClick={() => this.changeDeliverType('manual')}
            >
              <FormattedMessage id="virtualCards.create.generateCodes" defaultMessage="I'll send the codes myself" />
            </RadioButtonWithLabel>
          </DeliverTypeRadioSelector>

          {/* Show different fields based on deliver type */}
          {deliverType === 'email' && this.renderEmailFields()}
          {deliverType === 'manual' && this.renderManualFields()}

          {serverError && <P color="red.700">{serverError}</P>}

          <Box mb="1em" alignSelf="center">
            {this.renderSubmit()}
          </Box>
        </Flex>
      </form>
    );
  }
}

const addPaymentMethods = graphql(getCollectiveSourcePaymentMethodsQuery, {
  options: props => ({ variables: { id: props.collectiveId } }),
});

const addCreateVirtualCardsMutation = graphql(createVirtualCardsMutationQuery, {
  props: ({ mutate, ownProps }) => ({
    createVirtualCards: variables =>
      mutate({
        variables: {
          ...variables,
          CollectiveId: ownProps.collectiveId,
        },
      }),
  }),
});

export default addPaymentMethods(addCreateVirtualCardsMutation(CreateVirtualCardsForm));
