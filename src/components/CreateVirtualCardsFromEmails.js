import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { graphql } from 'react-apollo';

import { CheckCircle } from 'styled-icons/fa-regular/CheckCircle.cjs';

import { getCollectiveSourcePaymentMethodsQuery } from '../graphql/queries';
import { createVirtualCardsMutationQuery } from '../graphql/mutations';
import StyledInputAmount from './StyledInputAmount';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledPaymentMethodChooser from './StyledPaymentMethodChooser';
import Loading from './Loading';
import Link from './Link';
import StyledMultiEmailInput from './StyledMultiEmailInput';
import { P } from './Text';

const MIN_AMOUNT = 5;
const MAX_AMOUNT = 10000;

const InlineField = ({ name, children, label, isLabelClickable }) => (
  <Flex alignItems="center" mb="2.5em" className={`field-${name}`}>
    <Box css={{ flexBasis: '12em' }}>
      <label htmlFor={`virtualcard-${name}`} style={isLabelClickable && { cursor: 'pointer' }}>
        {label}
      </label>
    </Box>
    {children}
  </Flex>
);

const FieldLabelDetails = styled.span`
  color: ${themeGet('colors.black.400')};
  font-weight: 400;
`;

class CreateVirtualCardsFromEmails extends Component {
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
      values: { emails: [], amount: '', onlyOpensource: true },
      errors: { emails: [] },
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
    }
  }

  isSubmitEnabled() {
    // Others fields validity are checked with HTML5 validation (see `onSubmit`)
    const { values, errors } = this.state;
    return values.emails.length > 0 && errors.emails.length == 0;
  }

  onSubmit(e) {
    e.preventDefault();
    const { values, submitting } = this.state;
    if (!submitting && this.form.current.reportValidity()) {
      this.setState({ submitting: true });
      this.props
        .createVirtualCards({
          amount: values.amount * 100,
          emails: values.emails,
          PaymentMethodId: values.PaymentMethodId || this.getDefaultPaymentMethod().id,
          limitedToOpenSourceCollectives: values.onlyOpensource,
        })
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

  renderSubmit() {
    const { submitting, values } = this.state;
    const count = values.emails.length;
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

  renderSuccess(createdVirtualCards) {
    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        <P color="green.700">
          <CheckCircle size="3em" />
        </P>
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
      </Flex>
    );
  }

  render() {
    const loading = get(this.props, 'data.loading');
    const paymentMethods = get(this.props, 'data.Collective.paymentMethods', []);

    if (loading) return <Loading />;
    if (paymentMethods.length === 0) return this.renderNoPaymentMethodMessage();

    const { submitting, values, errors, createdVirtualCards, serverError } = this.state;

    return createdVirtualCards ? (
      this.renderSuccess(createdVirtualCards)
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
                id="virtualCards.create.onlyOpenSource"
                defaultMessage="Limit to opensource collectives"
              />
            }
          >
            <StyledCheckbox
              inputId="virtualcard-onlyOpensource"
              name="onlyOpensource"
              checked={values.onlyOpensource}
              onChange={({ checked }) => this.onChange('onlyOpensource', checked)}
              size="25px"
            />
          </InlineField>

          <Flex flexDirection="column" mb="3em">
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
              onChange={value => this.onChange('emails', value)}
              disabled={submitting}
            />
          </Flex>

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

export default addPaymentMethods(addCreateVirtualCardsMutation(CreateVirtualCardsFromEmails));
