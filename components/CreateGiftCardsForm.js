import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { RadioButtonChecked } from '@styled-icons/material/RadioButtonChecked';
import { RadioButtonUnchecked } from '@styled-icons/material/RadioButtonUnchecked';
import themeGet from '@styled-system/theme-get';
import dayjs from 'dayjs';
import { get, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import NextLink from 'next/link';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { isPrepaid } from '../lib/constants/payment-methods';
import { compose, reportValidityHTML5 } from '../lib/utils';

import CollectivePicker from './CollectivePicker';
import Container from './Container';
import CreateGiftCardsSuccess from './CreateGiftCardsSuccess';
import { Box, Flex } from './Grid';
import { I18nSupportLink } from './I18nFormatters';
import Loading from './Loading';
import MessageBox from './MessageBox';
import PaymentMethodSelect from './PaymentMethodSelect';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledInputAmount from './StyledInputAmount';
import StyledMultiEmailInput from './StyledMultiEmailInput';
import StyledSelectCreatable from './StyledSelectCreatable';

const MIN_AMOUNT = 500;
const MAX_AMOUNT = 100000000;

const messages = defineMessages({
  emailCustomMessage: {
    id: 'giftCards.email.customMessage',
    defaultMessage: 'Will be sent in the invitation email',
  },
  limitToHostsPlaceholder: {
    id: 'giftCards.limitToHosts.placeholder',
    defaultMessage: 'All Hosts',
  },
  limitToCollectivesPlaceholder: {
    id: 'giftCards.limitToCollectives.placeholder',
    defaultMessage:
      'All Collectives {nbHosts, plural, =0 {} =1 {under the selected Host} other {under the selected Hosts}}',
  },
  notBatched: {
    id: 'giftCards.notBatched',
    defaultMessage: 'Not batched',
  },
});

const InlineField = ({ name, children, label, isLabelClickable }) => (
  <Flex flexWrap="wrap" alignItems="center" mb="2.5em" className={`field-${name}`}>
    <Box width={[1, 0.3]}>
      <label htmlFor={`giftcard-${name}`} style={{ cursor: isLabelClickable ? 'pointer' : 'inherit', width: '100%' }}>
        {label}
      </label>
    </Box>
    {children}
  </Flex>
);

InlineField.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node,
  label: PropTypes.node,
  isLabelClickable: PropTypes.bool,
};

const Entry = styled.details`
  &[open] {
    summary::after {
      content: '−';
    }
  }

  summary {
    margin-top: ${themeGet('space.2')}px;
    margin-bottom: ${themeGet('space.4')}px;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${themeGet('colors.black.800')};
    /* Remove arrow on Firefox */
    list-style: none;

    &:hover {
      color: ${themeGet('colors.black.700')};
    }
  }

  summary:focus {
    outline: 1px dashed ${themeGet('colors.black.200')};
    outline-offset: ${themeGet('space.1')}px;
  }

  summary::after {
    content: '+';
    display: inline-block;
    padding-left: ${themeGet('space.2')}px;
    color: ${themeGet('colors.black.600')};
    font-weight: bold;
  }

  /* Remove arrow on Chrome */
  summary::-webkit-details-marker {
    display: none;
  }
`;

/** Entry title */
export const Title = styled.summary``;

const DeliverTypeRadioSelector = styled(Flex)`
  justify-content: space-evenly;
  align-items: center;
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
      <label textAlign="center" px={2} style={{ marginTop: 8, cursor: 'pointer' }}>
        {children}
      </label>
    </RadioButtonContainer>
  );
};

RadioButtonWithLabel.propTypes = {
  checked: PropTypes.bool,
  onClick: PropTypes.func,
  name: PropTypes.string,
  children: PropTypes.node,
};

const FieldLabelDetails = styled.span`
  color: ${themeGet('colors.black.600')};
  font-weight: normal;
`;

class CreateGiftCardsForm extends Component {
  static propTypes = {
    collectiveId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    createGiftCards: PropTypes.func.isRequired,
    collectiveSettings: PropTypes.object.isRequired,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.object,
      Collective: PropTypes.shape({
        paymentMethods: PropTypes.array,
      }),
      allHosts: PropTypes.shape({
        collectives: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number,
          }),
        ),
      }),
    }),
    /** @ignore from injectIntl */
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.form = React.createRef();
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      deliverType: 'email', // email or manual
      values: {
        batch: null,
        amount: MIN_AMOUNT,
        emails: [],
        customMessage: '',
        numberOfGiftCards: 1,
        limitedToHosts: [],
        expiryDate: dayjs().add(12, 'month').format('YYYY-MM-DD'),
      },
      errors: { emails: [] },
      multiEmailsInitialState: null,
      submitting: false,
      createdGiftCards: null,
      serverError: null,
    };
  }

  onChange(fieldName, value) {
    const errors = {};

    // Format value
    if (fieldName === 'emails') {
      const { emails, invalids } = value;
      value = emails;
      errors.emails = invalids;
    } else if (fieldName === 'numberOfGiftCards') {
      const intNumberOfGiftCards = parseInt(value);
      value = !isNaN(intNumberOfGiftCards) ? intNumberOfGiftCards : 1;
    }

    // Set value
    this.setState(state => ({
      values: Object.assign(state.values, { [fieldName]: value }),
      errors: Object.assign(state.errors, errors),
    }));
  }

  isSubmitEnabled() {
    // Others fields validity are checked with HTML5 validation (see `onSubmit`)
    const { values, errors, deliverType } = this.state;

    if (deliverType === 'email') {
      return values.emails.length > 0 && errors.emails.length == 0;
    } else {
      return values.numberOfGiftCards !== 0;
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const { values, submitting, deliverType } = this.state;
    if (!submitting && reportValidityHTML5(this.form.current)) {
      const paymentMethod = values.paymentMethod || this.getDefaultPaymentMethod();
      const limitations = {};
      if (this.canLimitToCollectives(paymentMethod)) {
        limitations.limitedToHostCollectiveIds = this.optionsToIdsList(values.limitedToHosts);
      }

      this.setState({ submitting: true });
      const variables = {
        CollectiveId: this.props.collectiveId,
        amount: values.amount,
        PaymentMethodId: paymentMethod.id,
        expiryDate: values.expiryDate,
        batch: values.batch,
        ...limitations,
      };

      if (deliverType === 'email') {
        variables.emails = values.emails;
        variables.customMessage = values.customMessage;
      } else if (deliverType === 'manual') {
        variables.numberOfGiftCards = values.numberOfGiftCards;
      }

      this.props
        .createGiftCards({ variables })
        .then(({ data }) => {
          this.setState({ createdGiftCards: data.createGiftCards, submitting: false });
          window.scrollTo(0, 0);
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
        values.numberOfGiftCards = values.emails.length;
      }
      return { values, deliverType };
    });
  }

  renderSubmit() {
    const { submitting, values, deliverType } = this.state;
    const count = deliverType === 'email' ? values.emails.length : values.numberOfGiftCards;
    const enable = this.isSubmitEnabled();
    return (
      <StyledButton
        type="submit"
        buttonSize="large"
        buttonStyle="primary"
        minWidth="16em"
        disabled={!submitting && !enable}
        loading={submitting}
        data-cy="submit-new-gift-cards"
      >
        <FormattedMessage id="giftCards.generate" defaultMessage="Create {count} gift cards" values={{ count }} />
      </StyledButton>
    );
  }

  renderNoPaymentMethodMessage() {
    return (
      <Flex justifyContent="center">
        <NextLink href={`${this.props.collectiveSlug}/edit/payment-methods`}>
          <StyledButton buttonSize="large" mt="2em" justifyContent="center">
            <FormattedMessage
              id="giftCards.create.requirePM"
              defaultMessage="Add a payment method to create gift cards"
            />
          </StyledButton>
        </NextLink>
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
              <FormattedMessage id="giftCards.create.recipients" defaultMessage="Recipients" />
              <FieldLabelDetails>
                <FormattedMessage
                  id="giftCards.create.recipientsDetails"
                  defaultMessage="A list of emails that will receive a gift card"
                />
              </FieldLabelDetails>
            </Flex>
          </label>
          <StyledMultiEmailInput
            className="gift-cards-recipients"
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
              <FormattedMessage id="giftCards.create.customMessage" defaultMessage="Custom message" />
              <FieldLabelDetails>
                <FormattedMessage id="forms.optional" defaultMessage="Optional" />
              </FieldLabelDetails>
            </Flex>
          }
        >
          <StyledInput
            id="giftcard-customMessage"
            type="text"
            maxLength="255"
            placeholder={this.props.intl.formatMessage(messages.emailCustomMessage)}
            onChange={e => this.onChange('customMessage', e.target.value)}
            style={{ flexGrow: 1 }}
            disabled={submitting}
          />
        </InlineField>
      </Box>
    );
  }

  renderManualFields() {
    const { collectiveSettings } = this.props;
    const giftCardsMaxDailyCount = get(collectiveSettings, `giftCardsMaxDailyCount`) || 100;
    return (
      <Container display="flex" flexDirection="column" width={1} justifyContent="center">
        <Flex justifyContent="center" mt={3} mb={4} alignItems="center">
          <label htmlFor="giftcard-numberOfGiftCards">
            <FormattedMessage id="giftCards.create.number" defaultMessage="Number of gift cards" />
          </label>
          <StyledInput
            id="giftcard-numberOfGiftCards"
            name="giftcard-numberOfGiftCards"
            type="number"
            step="1"
            min="1"
            ml={3}
            max={giftCardsMaxDailyCount}
            maxWidth="6.5em"
            onChange={e => this.onChange('numberOfGiftCards', e.target.value)}
            value={this.state.values.numberOfGiftCards}
            disabled={this.state.submitting}
          />
        </Flex>
      </Container>
    );
  }

  optionsToIdsList(options) {
    return options ? options.map(({ value }) => value.id) : [];
  }

  canLimitToCollectives(paymentMethod) {
    return !isPrepaid(paymentMethod);
  }

  /** Get batch options for select. First option is always "No batch" */
  getBatchesOptions = memoizeOne((batches, intl) => {
    const noBatchOption = { label: intl.formatMessage(messages.notBatched), value: null };
    if (!batches) {
      return [noBatchOption];
    } else {
      return [
        noBatchOption,
        ...batches.filter(b => b.name !== null).map(batch => ({ label: batch.name, value: batch.name })),
      ];
    }
  });

  render() {
    const { data, intl, collectiveSlug, currency, collectiveSettings } = this.props;
    const { submitting, values, createdGiftCards, serverError, deliverType } = this.state;
    const loading = get(data, 'loading');
    const error = get(data, 'error');
    const paymentMethods = get(data, 'Collective.paymentMethods', []);
    const batches = get(data, 'Collective.giftCardsBatches');
    const hosts = get(data, 'allHosts.collectives', []);
    const canLimitToCollectives = this.canLimitToCollectives(values.paymentMethod);
    const batchesOptions = this.getBatchesOptions(batches, intl);

    if (loading) {
      return <Loading />;
    } else if (error) {
      return (
        <MessageBox type="error" withIcon>
          {error.message}
        </MessageBox>
      );
    } else if (paymentMethods.length === 0) {
      return this.renderNoPaymentMethodMessage();
    } else if (createdGiftCards) {
      return (
        <CreateGiftCardsSuccess cards={createdGiftCards} deliverType={deliverType} collectiveSlug={collectiveSlug} />
      );
    }

    return (
      <form ref={this.form} onSubmit={this.onSubmit}>
        <Flex flexDirection="column">
          <InlineField name="amount" label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}>
            <StyledInputAmount
              id="giftcard-amount"
              currency={currency}
              prepend={currency}
              onChange={value => this.onChange('amount', value)}
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
            label={<FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />}
          >
            <PaymentMethodSelect
              disabled={submitting}
              paymentMethods={paymentMethods}
              defaultPaymentMethod={this.getDefaultPaymentMethod()}
              onChange={pm => this.onChange('paymentMethod', pm)}
            />
          </InlineField>

          <InlineField
            name="expiryDate"
            isLabelClickable
            label={<FormattedMessage id="giftCards.create.expiryDate" defaultMessage="Expiry date" />}
          >
            <StyledInput
              id="giftcard-expiryDate"
              name="expiryDate"
              value={values.expiryDate}
              onChange={e => this.onChange('expiryDate', e.target.value)}
              type="date"
              required
              min={dayjs().add(1, 'day').format('YYYY-MM-DD')}
            />
          </InlineField>

          <InlineField
            name="batch"
            label={
              <Flex flexDirection="column">
                <FormattedMessage id="giftCards.batch" defaultMessage="Batch name" />
                <FieldLabelDetails>
                  <FormattedMessage id="forms.optional" defaultMessage="Optional" />
                </FieldLabelDetails>
              </Flex>
            }
          >
            <StyledSelectCreatable
              id="giftcard-batch"
              onChange={({ value }) => this.onChange('batch', truncate(value, { length: 200 }))}
              minWidth={300}
              disabled={submitting}
              fontSize="14px"
              options={batchesOptions}
              defaultValue={batchesOptions[0]}
            />
          </InlineField>

          {canLimitToCollectives && (
            <React.Fragment>
              <Entry>
                <Title>
                  <FormattedMessage id="GiftCard.Limitations" defaultMessage="Limitations" />
                </Title>
                <InlineField
                  name="limitToHosts"
                  label={
                    <Flex flexDirection="column">
                      <FormattedMessage
                        id="giftCards.create.limitToHosts"
                        defaultMessage="Limit to the following Hosts"
                      />
                      <FieldLabelDetails>
                        <FormattedMessage id="forms.optional" defaultMessage="Optional" />
                      </FieldLabelDetails>
                    </Flex>
                  }
                >
                  <CollectivePicker
                    placeholder={intl.formatMessage(messages.limitToHostsPlaceholder)}
                    disabled={hosts.length === 0}
                    minWidth={300}
                    maxWidth={600}
                    sortFunc={collectives => collectives} /** Sort is handled by the API */
                    groupByType={false}
                    collectives={hosts}
                    defaultValue={values.limitedToHosts}
                    onChange={options => this.onChange('limitedToHosts', options)}
                    isMulti
                  />
                </InlineField>
              </Entry>
            </React.Fragment>
          )}

          <DeliverTypeRadioSelector className="deliver-type-selector">
            <RadioButtonWithLabel
              name="email"
              checked={deliverType === 'email'}
              onClick={() => this.changeDeliverType('email')}
            >
              <FormattedMessage id="giftCards.create.sendEmails" defaultMessage="Send the cards by&#160;email" />
            </RadioButtonWithLabel>
            <RadioButtonWithLabel
              name="manual"
              checked={deliverType === 'manual'}
              onClick={() => this.changeDeliverType('manual')}
            >
              <FormattedMessage id="giftCards.create.generateCodes" defaultMessage="I'll send the codes myself" />
            </RadioButtonWithLabel>
          </DeliverTypeRadioSelector>

          <MessageBox type="info" fontSize="13px" withIcon mb={4}>
            <FormattedMessage
              id="GiftCard.Limitinfo"
              defaultMessage="Your account is currently limited to {limit} gift cards per day. If you want to increase that limit, please contact <SupportLink></SupportLink>."
              values={{
                SupportLink: I18nSupportLink,
                limit: get(collectiveSettings, `giftCardsMaxDailyCount`) || 100,
              }}
            />
          </MessageBox>

          {/* Show different fields based on deliver type */}
          {deliverType === 'email' && this.renderEmailFields()}
          {deliverType === 'manual' && this.renderManualFields()}

          {serverError && (
            <MessageBox type="error" withIcon>
              {serverError}
            </MessageBox>
          )}

          <Box mb="1em" alignSelf="center" mt={3}>
            {this.renderSubmit()}
          </Box>
        </Flex>
      </form>
    );
  }
}

/**
 * A query to get a collective source payment methods. This will not return
 * gift cards, as a gift card cannot be used as a source payment method
 * for another payment method.
 */
export const collectiveSourcePaymentMethodsQuery = gql`
  query CollectiveSourcePaymentMethods($id: Int) {
    Collective(id: $id) {
      id
      giftCardsBatches {
        id
        name
        count
      }
      paymentMethods(types: ["creditcard", "prepaid"], hasBalanceAboveZero: true) {
        id
        uuid
        name
        data
        monthlyLimitPerMember
        service
        type
        balance
        currency
        expiryDate
        batch
      }
    }
    allHosts(limit: 100, onlyOpenHosts: false, minNbCollectivesHosted: 1) {
      collectives {
        id
        type
        name
        slug
        imageUrl
      }
    }
  }
`;

const addCollectiveSourcePaymentMethodsQuery = graphql(collectiveSourcePaymentMethodsQuery, {
  options: props => ({
    variables: { id: props.collectiveId },
    fetchPolicy: 'network-only',
  }),
});

const createGiftCardsMutation = gql`
  mutation CreateGiftCards(
    $CollectiveId: Int!
    $numberOfGiftCards: Int
    $emails: [String]
    $PaymentMethodId: Int
    $amount: Int
    $monthlyLimitPerMember: Int
    $description: String
    $expiryDate: String
    $currency: String
    $limitedToTags: [String]
    $limitedToHostCollectiveIds: [Int]
    $customMessage: String
    $batch: String
  ) {
    createGiftCards(
      amount: $amount
      monthlyLimitPerMember: $monthlyLimitPerMember
      CollectiveId: $CollectiveId
      PaymentMethodId: $PaymentMethodId
      description: $description
      expiryDate: $expiryDate
      currency: $currency
      limitedToTags: $limitedToTags
      limitedToHostCollectiveIds: $limitedToHostCollectiveIds
      numberOfGiftCards: $numberOfGiftCards
      emails: $emails
      customMessage: $customMessage
      batch: $batch
    ) {
      id
      name
      uuid
      batch
      limitedToHostCollectiveIds
      description
      initialBalance
      monthlyLimitPerMember
      expiryDate
      currency
      data
    }
  }
`;

const addCreateGiftCardsMutation = graphql(createGiftCardsMutation, {
  name: 'createGiftCards',
});

const addGraphql = compose(addCollectiveSourcePaymentMethodsQuery, addCreateGiftCardsMutation);

export default injectIntl(addGraphql(CreateGiftCardsForm));
