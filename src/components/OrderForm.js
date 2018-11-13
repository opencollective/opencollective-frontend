import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

import { pick, get } from 'lodash';
import { withApollo } from 'react-apollo';
import { Button, Col, Form, FormGroup, Row } from 'react-bootstrap';

import colors from '../constants/colors';
import TierComponent from './Tier';
import InputField from './InputField';
import MatchingFundWithData from './MatchingFundWithData';
import ActionButton from './Button';
import SectionTitle from './SectionTitle';
import CreateOrganizationForm from './CreateOrganizationForm';
import withIntl from '../lib/withIntl';
import {
  defineMessages,
  FormattedMessage,
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import {
  capitalize,
  formatCurrency,
  isValidEmail,
  getEnvVar,
} from '../lib/utils';
import { getPaypal } from '../lib/paypal';
import { getStripeToken } from '../lib/stripe';
import { getRecaptcha, getRecaptchaSiteKey } from '../lib/recaptcha';
import { checkUserExistence, signin } from '../lib/api';
import { getOcCardBalanceQuery } from '../graphql/queries';

class OrderForm extends React.Component {
  static propTypes = {
    order: PropTypes.object.isRequired, // { tier: {}, quantity: Int, interval: String, totalAmount: Int }
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func,
    matchingFund: PropTypes.string,
    redeemFlow: PropTypes.bool,
    intl: PropTypes.object,
    client: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const { intl, order } = props;
    const tier = { ...order.tier };

    this.state = {
      isNewUser: true,
      loginSent: false,
      user: {},
      fromCollective: {},
      paymentMethod: {
        type: 'creditcard',
      },
      creditcard: {
        show: !this.props.redeemFlow,
        save: true,
      },
      ocCard: {
        applySent: false,
        loading: false,
        expanded: this.props.redeemFlow,
      },
      orgDetails: {
        show: false,
      },
      /* Set by loadPayPalButton(). This field stores the data from
         the authorization so we can ask the user's confirmation
         before processing the payment. */
      paypalOrderRequest: null,
      order: order || {},
      result: {},
      recaptchaToken: null,
    };

    this.state.order.totalAmount =
      this.state.order.totalAmount || tier.amount * (tier.quantity || 1);
    this.paymentMethodsOptions = [];
    this.allowOrganizations = order.tier.type !== 'TICKET';

    this.messages = defineMessages({
      'order.contributeAs': {
        id: 'tier.order.contributeAs',
        defaultMessage: 'Contribute as',
      },
      'order.rsvpAs': { id: 'tier.order.rsvpAs', defaultMessage: 'RSVP as' },
      'order.profile.myself': {
        id: 'tier.order.profile.myself',
        defaultMessage: 'myself',
      },
      'order.success': {
        id: 'tier.order.success',
        defaultMessage: '🎉 Your order has been processed successfully',
      },
      'order.error': {
        id: 'tier.order.error',
        defaultMessage:
          "An error occured 😳. The order didn't go through. Please try again in a few.",
      },
      'order.button': {
        id: 'tier.order.button',
        defaultMessage: 'place order',
      },
      'order.organization.create': {
        id: 'tier.order.organization.create',
        defaultMessage: 'create an organization',
      },
      'order.profile.logout': {
        id: 'tier.order.profile.logout',
        defaultMessage: 'logout to create a new profile',
      },
      'error.email.invalid': {
        id: 'error.email.invalid',
        defaultMessage: 'Invalid email address',
      },
      'creditcard.label': {
        id: 'creditcard.label',
        defaultMessage: 'Credit Card',
      },
      'creditcard.save': {
        id: 'creditcard.save',
        defaultMessage:
          'Save credit card to {type, select, user {my account} other {{type} account}}',
      },
      'creditcard.missing': {
        id: 'creditcard.missing',
        defaultMessage: 'Credit card missing',
      },
      'creditcard.error': {
        id: 'creditcard.error',
        defaultMessage: 'Invalid credit card',
      },
      'paymentMethod.type': {
        id: 'paymentMethod.type',
        defaultMessage: 'Payment method',
      },
      'paymentMethod.creditcard': {
        id: 'paymentMethod.creditcard',
        defaultMessage: 'credit card',
      },
      'paymentMethod.bitcoin': {
        id: 'paymentMethod.bitcoin',
        defaultMessage: 'bitcoin',
      },
      'paymentMethod.paypal': {
        id: 'paymentMethod.paypal',
        defaultMessage: 'paypal',
      },
      'paymentMethod.manual': {
        id: 'paymentMethod.manual',
        defaultMessage: 'bank transfer',
      },
      'ocCard.label': { id: 'occard.label', defaultMessage: 'Gift Card' },
      'ocCard.apply': { id: 'occard.apply', defaultMessage: 'Apply' },
      'ocCard.invalid': {
        id: 'occard.invalid',
        defaultMessage: 'Invalid code',
      },
      'ocCard.expired': {
        id: 'occard.expired',
        defaultMessage: 'Expired code',
      },
      'ocCard.loading': {
        id: 'pleasewait',
        defaultMessage: 'Please wait...',
      },
      'ocCard.amountremaining': {
        id: 'occard.amountremaining',
        defaultMessage: 'Valid code. Amount available: ',
      },
      'ocCard.amounterror': {
        id: 'occard.amounterror',
        defaultMessage:
          'You can only contribute up to the amount available on your gift card.',
      },
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'backer.title': {
        id: 'tier.order.backer.title',
        defaultMessage: 'Become a {name}',
      },
      'sponsor.title': {
        id: 'tier.order.sponsor.title',
        defaultMessage: 'Become a {name}',
      },
      'type.label': { id: 'tier.type.label', defaultMessage: 'type' },
      'firstName.label': {
        id: 'user.firstName.label',
        defaultMessage: 'first name',
      },
      'lastName.label': {
        id: 'user.lastName.label',
        defaultMessage: 'last name',
      },
      'company.label': { id: 'user.company.label', defaultMessage: 'company' },
      'website.label': { id: 'user.website.label', defaultMessage: 'website' },
      'twitterHandle.label': {
        id: 'user.twitterHandle.label',
        defaultMessage: 'twitter',
      },
      'twitterHandle.description': {
        id: 'user.twitterHandle.description',
        defaultMessage: 'If any',
      },
      'email.label': { id: 'user.email.label', defaultMessage: 'email' },
      'email.description': {
        id: 'user.email.description',
        defaultMessage: '* required',
      },
      'email.description.login': {
        id: 'signin.login.description',
        defaultMessage:
          'Welcome back! Click on "Login" (or hit Enter) and we will send you a link to login by email.',
      },
      'email.description.signup': {
        id: 'signin.emailSent.description',
        defaultMessage:
          'Login email sent. Please follow the instructions in that email to proceed.',
      },
      'description.label': {
        id: 'user.description.label',
        defaultMessage: 'Short bio',
      },
      'description.description': {
        id: 'user.description.description',
        defaultMessage:
          'Present yourself in 60 characters or less, if you can!',
      },
      'totalAmount.label': {
        id: 'tier.totalAmount.label',
        defaultMessage: 'Total amount',
      },
      'startsAt.label': {
        id: 'tier.startsAt.label',
        defaultMessage: 'start date and time',
      },
      'endsAt.label': {
        id: 'tier.endsAt.label',
        defaultMessage: 'end date and time',
      },
      'order.error.organization.name.required': {
        id: 'order.error.organization.name.required',
        defaultMessage: 'Please provide a name for the new organization',
      },
      'order.error.organization.website.required': {
        id: 'order.error.organization.website.required',
        defaultMessage: 'Please provide a website for the new organization',
      },
      'order.publicMessage.placeholder': {
        id: 'order.publicMessage.placeholder',
        defaultMessage: 'Use this space to add a personal message (public)',
      },
      'newsletterOptIn.description': {
        id: 'user.newsletterOptIn.description',
        defaultMessage: 'Subscribe to the Open Collective newsletter.',
      },
    });

    this.fields = [
      {
        name: 'firstName',
        maxLength: 127,
      },
      {
        name: 'lastName',
        maxLength: 128,
      },
      {
        name: 'company',
        maxLength: 255,
      },
      {
        name: 'website',
        maxLength: 255,
      },
      {
        name: 'twitterHandle',
        pre: '@',
        maxLength: 255,
        validate: val => val.match(/^[A-Za-z0-9_]{1,15}$/),
      },
      {
        name: 'description',
        maxLength: 255,
      },
    ];

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(
          this.messages[`${field.name}.description`],
        );
      }
      return field;
    });

    this.populateProfiles();
  }

  componentDidMount() {
    this._isMounted = true;
    this.UNSAFE_componentWillReceiveProps(this.props);

    // Recaptcha
    getRecaptcha()
      .then(recaptcha => {
        recaptcha.ready(() => {
          recaptcha
            .execute(getRecaptchaSiteKey(), { action: 'OrderForm' })
            .then(recaptchaToken => {
              this.setState({ recaptchaToken });
            });
        });
      })
      .catch(err => {
        console.log('Recaptcha error', err);
      });
  }

  UNSAFE_componentWillReceiveProps(props) {
    const { LoggedInUser } = props;
    if (!LoggedInUser) return;
    if (!this._isMounted) return; // Fixes error: Can only update a mounted or mounting component
    this.setState({ LoggedInUser, isNewUser: !LoggedInUser });
    this.populateProfiles(LoggedInUser);
    setTimeout(() => this.selectProfile(LoggedInUser.CollectiveId), 0); // need to pass a cycle to let setState take effect
  }

  // All the following methods are arrow functions and auto-bind

  /** Interval set either in the tier or in the order object */
  interval = () =>
    this.state.order.interval || get(this.state, 'order.tier.interval');

  /** Populate the combo of payment methods */
  populatePaymentMethodTypes = host => {
    const { intl } = this.props;
    const paymentMethodTypeOptions = [
      {
        creditcard: intl.formatMessage(
          this.messages['paymentMethod.creditcard'],
        ),
      },
    ];
    /* We only support paypal for one time donations to the open
       source collective for now. */
    if (host.id === 11004 && this.interval() === null) {
      paymentMethodTypeOptions.push({
        payment: intl.formatMessage(this.messages['paymentMethod.paypal']),
      });
    }
    // Add the option to pay by wire transfer for the BrusselsTogether host
    if (get(host, 'settings.paymentMethods.manual') && !this.interval()) {
      paymentMethodTypeOptions.push({
        manual:
          get(host, 'settings.paymentMethods.manual.title') ||
          intl.formatMessage(this.messages['paymentMethod.manual']),
      });
    }
    this.paymentMethodTypeOptions = paymentMethodTypeOptions;
  };

  paymentMethodsOptionsForCollective = (paymentMethods, collective) => {
    return paymentMethods.map(pm => {
      const value = pm.uuid;
      const brand = get(pm, 'data.brand') || get(pm, 'type');
      /* The expiryDate field will show up for prepaid cards */
      const expiration = pm.expiryDate
        ? `- exp ${moment(pm.expiryDate).format('MM/Y')}`
        : get(pm, 'data.expMonth') || get(pm, 'data.expYear')
          ? `- exp ${get(pm, 'data.expMonth')}/${get(pm, 'data.expYear')}`
          : '';
      /* Prepaid cards have their balance available */
      const balance = pm.balance
        ? `(${formatCurrency(pm.balance, pm.currency)})`
        : '';
      /* Assemble all the pieces in one string */
      const name = `${brand} ${pm.name}`;
      const label = `💳  \xA0\xA0${
        collective.name
      } - ${name} ${expiration} ${balance}`;
      return { [value]: label };
    });
  };

  populatePaymentMethods = CollectiveId => {
    const { LoggedInUser } = this.props;

    let paymentMethodsOptions = [];

    const collective = this.collectivesById[CollectiveId];

    const filterPMs = pms =>
      (pms || []).filter(
        pm =>
          pm.service === 'stripe' ||
          pm.service === 'paypal' ||
          (pm.service === 'opencollective' &&
            ['prepaid', 'collective', 'virtualcard'].includes(pm.type)),
      );

    if (collective) {
      const paymentMethods = filterPMs(collective.paymentMethods);
      paymentMethodsOptions = this.paymentMethodsOptionsForCollective(
        paymentMethods,
        collective,
      );
    }

    if (LoggedInUser && CollectiveId !== LoggedInUser.CollectiveId) {
      const userCollective = this.collectivesById[LoggedInUser.CollectiveId];
      const paymentMethods = filterPMs(LoggedInUser.collective.paymentMethods);
      paymentMethodsOptions = [
        ...paymentMethodsOptions,
        ...this.paymentMethodsOptionsForCollective(
          paymentMethods,
          userCollective,
        ),
      ];
    }

    if (paymentMethodsOptions.length > 0) {
      paymentMethodsOptions.push({ other: 'other' });
    }

    this.paymentMethodsOptions = paymentMethodsOptions;
  };

  /**
   * Populate the profiles available based on the current logged in user
   * If the tier is a ticket, you can only order the ticket as an individual
   * Otherwise, you can order a tier as an individual or as any organization that you are an admin of
   * @param {*} LoggedInUser
   */
  populateProfiles = LoggedInUser => {
    const { intl } = this.props;
    const fromCollectiveOptions = [],
      collectivesById = {};

    if (LoggedInUser) {
      fromCollectiveOptions.push({
        [LoggedInUser.CollectiveId]: LoggedInUser.collective.name,
      });
      collectivesById[LoggedInUser.CollectiveId] = LoggedInUser.collective;
      LoggedInUser.memberOf.map(membership => {
        if (
          membership.collective.type === 'COLLECTIVE' &&
          membership.role !== 'ADMIN'
        )
          return;
        if (membership.collective.type === 'EVENT') return;
        if (
          membership.collective.type === 'ORGANIZATION' &&
          !this.allowOrganizations
        )
          return;
        if (['ADMIN', 'HOST'].indexOf(membership.role) === -1) return;
        const value = get(membership, 'collective.id');
        const label = get(membership, 'collective.name');
        collectivesById[value] = pick(membership.collective, [
          'id',
          'type',
          'name',
          'paymentMethods',
        ]);
        fromCollectiveOptions.push({ [value]: label });
      });
    } else {
      fromCollectiveOptions.push({
        myself: intl.formatMessage(this.messages['order.profile.myself']),
      });
    }

    if (this.allowOrganizations) {
      fromCollectiveOptions.push({
        organization: intl.formatMessage(
          this.messages['order.organization.create'],
        ),
      });
    } else if (LoggedInUser) {
      fromCollectiveOptions.push({
        logout: intl.formatMessage(this.messages['order.profile.logout']),
      });
    }

    this.collectivesById = collectivesById;
    this.fromCollectiveOptions = fromCollectiveOptions;
  };

  logout = () => {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('LoggedInUser');
    window.location.replace(window.location.href);
  };

  selectProfile = profile => {
    if (profile === 'logout') {
      return this.logout();
    }
    const CollectiveId = isNaN(profile) ? null : profile;
    const collective = CollectiveId && this.collectivesById[CollectiveId];
    let fromCollective = {};
    if (collective) {
      fromCollective = {
        id: CollectiveId,
        type: collective.type,
        name: collective.name,
      };
    }
    const newState = {
      ...this.state,
      fromCollective,
      orgDetails: {
        show: Boolean(profile === 'organization'),
      },
      creditcard: {
        show: true,
      },
    };

    if (collective) {
      this.populatePaymentMethods(CollectiveId);
      if (this.paymentMethodsOptions.length > 0) {
        // The data structure looks like that:
        // [
        // { "8222e069-e4b0-4409-9563-167fa078fdaa" => "John Doe - Visa 4242 - exp 10/2018" },
        // { "3944a1fe-0878-4832-ab33-c493f536152e" => "John Doe - Visa 4343 - exp 11/2019" }
        // ]
        const uuid = Object.keys(this.paymentMethodsOptions[0])[0];
        // NOTE: might be fragile to have { show: undefined } as a result
        newState.creditcard = { uuid: uuid };
      } else {
        newState.creditcard = { show: true, save: true }; // reset to default value
      }
    }

    this.setState(newState);

    if (typeof window !== 'undefined') {
      window.state = newState;
    }
  };

  handleChange = (obj, attr, value) => {
    this.resetError();
    const newTier = { ...this.state.order.tier };
    const newOrder = { ...this.state.order };
    const newState = Object.assign({}, this.state, {
      order: newOrder,
      tier: newTier,
    });
    if (value === 'null') {
      value = null;
    }
    if (value !== undefined) {
      newState[obj][attr] = value;
    } else if (attr === null) {
      newState[obj] = {};
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (obj === 'creditcard' && attr.uuid === 'other') {
      newState.creditcard.show = true;
    }

    if (attr === 'tier') {
      newState.order.totalAmount =
        newState.order.tier.amount * (newState.order.tier.quantity || 1);
      if (newState.order.tier.quantity) {
        newState.order.quantity = newState.order.tier.quantity;
      }
      if (newState.order.tier.hasOwnProperty('interval')) {
        newState.order.interval = newState.order.tier.interval;
        if (newState.order.interval) {
          newState.paymentMethod.type = 'creditcard';
        }
      }
    }

    if (attr === 'email') {
      checkUserExistence(value).then(exists => {
        this.setState({ isNewUser: !exists });
      });
    }

    this.setState(newState, () => {
      if (typeof window !== 'undefined') {
        window.state = newState;
      }

      /* This is the type of the PayPal payment method */
      if (this.isPayPalSelected()) {
        this.loadPayPalButton();
      }
    });
  };

  /** Return true if PayPal is the selected payment method
   *
   * Because the way the Payment Method combo works we dont't really
   * have a better way to find out which option is selected. At some
   * point it'd be nice to save `service.type` instead of just `type`.
   */
  isPayPalSelected = () => this.state.paymentMethod.type === 'payment';

  /** Return true if the user has authorized a PayPal payment
   *
   * After the user authenticates & authorizes the payment using the
   * checkout button, PayPal will send us a token with the
   * authorization. This function returns `true` if the token is
   * available.
   */
  isPayPalAuthorized = () => !!this.state.paypalOrderRequest;

  /** Create the PayPal Checkout button and setup payment parameters
   *
   * This method is called when PayPal is selected as the payment
   * provider. It creates the PayPal button and hooks it up to the
   * backend methods that create and execute the payment.
   */
  loadPayPalButton = async () => {
    const button = document.getElementById('paypal-checkout');
    /* Destroy any already created button */
    button.innerHTML = '';
    /* Convert amount to what PayPal accepts (dollars) */
    const amount = this.getTotalAmount() / 100;
    /* We need some information about the order to create the PayPal
       payment object. */
    const orderRequest = this.prepareOrderRequest();
    /* Parameters for the paypal button */
    const renderOptions = {
      env: getEnvVar('PAYPAL_ENVIRONMENT'),
      commit: true,
      payment: async (data, actions) => {
        const paymentURL = '/api/services/paypal/create-payment';
        const { id } = await actions.request.post(paymentURL, {
          amount,
          currency: orderRequest.currency,
        });
        return id;
      },
      onAuthorize: async data => {
        /* We'll send the order to the backend but we need to inject
           the extra information needed by PayPal somewhere. And the
           chosen place was the data field in the PaymentMethod
           entry. */
        orderRequest.paymentMethod.data = data;
        /* Using the PayPal field as the token for this payment
           method. */
        orderRequest.paymentMethod.token = data.paymentToken;
        /* Corrects the `service.type' identification info */
        orderRequest.paymentMethod.service = 'paypal';
        orderRequest.paymentMethod.type = 'payment';
        return this.submitOrder(orderRequest);
      },
    };

    try {
      const paypal = await getPaypal();
      paypal.Button.render(renderOptions, '#paypal-checkout');
    } catch (error) {
      console.error(error);
    } finally {
      button.removeAttribute('disabled');
    }
  };

  getTotalAmount = () => {
    const { order } = this.state;
    const quantity = get(order, 'tier.quantity') || order.quantity || 1;
    const total = quantity * order.tier.amount || order.totalAmount;
    return total;
  };

  prepareOrderRequest = () => {
    const {
      paymentMethod,
      order,
      fromCollective,
      user,
      recaptchaToken,
    } = this.state;
    const { currency } = order.tier || this.props.collective;
    const quantity = get(order, 'tier.quantity') || order.quantity || 1;
    const orderRequest = {
      user,
      quantity,
      currency,
      paymentMethod,
      fromCollective,
      recaptchaToken,
      collective: { id: this.props.collective.id },
      publicMessage: order.publicMessage,
      interval: order.interval || order.tier.interval,
      totalAmount: this.getTotalAmount(),
      matchingFund: order.matchingFund,
    };
    if (order.tier && order.tier.id) {
      orderRequest.tier = { id: order.tier.id, amount: order.tier.amount };
    }
    return orderRequest;
  };

  /** Call the underlying onSubmit method with an order request  */
  submitOrder = async orderRequest =>
    this.props.onSubmit(orderRequest || this.prepareOrderRequest());

  /** Submit order built with PayPal payment method */
  submitPayPalOrder = async () =>
    this.submitOrder(this.state.paypalOrderRequest);

  handleSubmit = async () => {
    if (!(await this.validate())) return false;
    this.setState({ loading: true });
    try {
      await this.submitOrder();
    } finally {
      this.setState({ loading: false });
    }
  };

  error = msg => {
    const error = `${msg}`;
    this.setState({ result: { error } });
  };

  resetError = () => {
    this.setState({ result: { error: null } });
  };

  validate = async () => {
    const TEST_ENVIRONMENT =
      typeof window !== 'undefined' &&
      window.location.search.match(/test=e2e/) &&
      (window.location.hostname === 'staging.opencollective.com' ||
        window.location.hostname === 'localhost');

    const { intl } = this.props;
    const { order, user, creditcard, ocCard } = this.state;
    const newState = { ...this.state };

    // validate email
    if (this.state.isNewUser && !isValidEmail(user.email)) {
      this.setState({
        result: {
          error: intl.formatMessage(this.messages['error.email.invalid']),
        },
      });
      return false;
    }

    const required = (obj, attrPath, messageId) => {
      if (!get(obj, attrPath)) {
        throw new Error(intl.formatMessage(this.messages[messageId]));
      }
    };

    // validate new org
    if (this.state.orgDetails.show) {
      try {
        required(
          this.state,
          'fromCollective.name',
          'order.error.organization.name.required',
        );
        required(
          this.state,
          'fromCollective.website',
          'order.error.organization.website.required',
        );
      } catch (e) {
        this.setState({ result: { error: e.message } });
        return false;
      }
    }

    // validate payment method
    if (order.totalAmount > 0) {
      // favors ocCard over credit card
      if (ocCard.valid) {
        if (ocCard.balance < order.totalAmount) {
          this.setState({
            result: {
              error: intl.formatMessage(this.messages['ocCard.amounterror']),
            },
          });
          return false;
        }
        newState.paymentMethod = pick(ocCard, [
          'token',
          'service',
          'type',
          'uuid',
        ]);
        this.setState(newState);
        return true;
      } else if (creditcard.uuid && creditcard.uuid.length === 36) {
        newState.paymentMethod = { uuid: creditcard.uuid };
        this.setState(newState);
        return true;
      } else if (get(newState, 'paymentMethod.type') === 'manual') {
        return true;
      } else {
        let res;
        if (!creditcard.addEventListener && !TEST_ENVIRONMENT) {
          this.error(intl.formatMessage(this.messages['creditcard.missing']));
          return false;
        }
        try {
          res = await getStripeToken('cc', creditcard);
        } catch (e) {
          console.log('>>> error: ', typeof e, e);
          this.error(e);
          return false;
        }
        const last4 = res.card.last4;
        const paymentMethod = {
          name: last4,
          token: res.token,
          service: 'stripe',
          type: 'creditcard',
          data: {
            fullName: res.card.full_name,
            expMonth: res.card.exp_month,
            expYear: res.card.exp_year,
            brand: res.card.brand,
            country: res.card.country,
            funding: res.card.funding,
            zip: res.card.address_zip,
          },
          save: true,
        };
        newState.paymentMethod = paymentMethod;
        this.setState(newState);
        return true;
      }
    }
    return true;
  };

  resetOrder = () => {
    this.setState({ order: {} });
  };

  signin = () => {
    signin(
      this.state.user,
      `${window.location.pathname}${window.location.search}`,
    ).then(() => {
      this.setState({ loginSent: true });
    });
  };

  applyOcCardBalance = async () => {
    const { ocCard, creditcard, order } = this.state;

    this.setState({
      ocCard: Object.assign(ocCard, { applySent: true, loading: true }),
    });
    const { token } = ocCard;

    const args = { query: getOcCardBalanceQuery, variables: { token } };
    let result = null;
    try {
      result = await this.props.client.query(args);
    } catch (error) {
      this.setState({ ocCard: { loading: false } });
      this.error(error);
      return;
    }

    this.setState({ ocCard: Object.assign(ocCard, { loading: false }) });

    if (result.data && result.data.ocPaymentMethod) {
      // force a tier of the whole amount with null interval
      const tier = {
        interval: null,
        amount: result.data.ocPaymentMethod.balance,
        currency: result.data.ocPaymentMethod.currency,
        description: 'Thank you 🙏',
        name: 'Gift Card',
      };

      this.setState({
        ocCard: Object.assign(ocCard, {
          ...result.data.ocPaymentMethod,
          valid: true,
        }),
        creditcard: Object.assign(creditcard, { show: false }),
        order: Object.assign(order, {
          interval: null,
          totalAmount: result.data.ocPaymentMethod.balance,
          tier,
        }),
      });
    }
  };

  expandGiftCard = () => {
    this.setState({
      ocCard: Object.assign({}, this.state.ocCard, { expanded: true }),
    });
  };

  renderPayPalButton = () =>
    !this.isPayPalAuthorized() && (
      <FormGroup controlId="paypalFG" id="paypalFG">
        <div>
          <Col sm={2} />
          <Col sm={10}>
            <div id="paypal-checkout" />
          </Col>
        </div>
      </FormGroup>
    );

  renderDisclaimer = values => {
    return (
      <div className="disclaimer">
        <style jsx>
          {`
            .disclaimer {
              margin: 0.5rem;
              font-size: 1.2rem;
            }
          `}
        </style>
        <FormattedMessage
          id="collective.host.disclaimer"
          defaultMessage="By clicking above, you are pledging to give the host ({hostname}) {amount} {interval, select, month {per month} year {per year} other {}} for {collective}."
          values={values}
        />

        {values.interval && (
          <div>
            <FormattedMessage
              id="collective.host.cancelanytime"
              defaultMessage="You can cancel anytime."
            />
          </div>
        )}
      </div>
    );
  };

  renderCreditCard = () => {
    const { intl } = this.props;
    const { ocCard, creditcard } = this.state;
    const showNewCreditCardForm =
      !ocCard.show &&
      creditcard.show &&
      (!creditcard.uuid || creditcard.uuid === 'other');
    const inputOcCard = {
      type: 'text',
      name: 'ocCard',
      button: (
        <Button
          className="ocCardApply"
          disabled={ocCard.loading}
          onClick={this.applyOcCardBalance}
        >
          {intl.formatMessage(this.messages['ocCard.apply'])}
        </Button>
      ),
      required: true,
      label: intl.formatMessage(this.messages['ocCard.label']),
      defaultValue: ocCard['token'],
      onChange: value => this.handleChange('ocCard', 'token', value),
    };

    if (ocCard.applySent) {
      if (ocCard.loading) {
        inputOcCard.description = intl.formatMessage(
          this.messages['ocCard.loading'],
        );
      } else if (ocCard.valid) {
        inputOcCard.description = `${intl.formatMessage(
          this.messages['ocCard.amountremaining'],
        )} ${formatCurrency(ocCard.balance, ocCard.currency)}`;
      } else {
        inputOcCard.description = intl.formatMessage(
          this.messages['ocCard.invalid'],
        );
      }
    }

    return (
      <Row>
        <Col sm={12}>
          {this.paymentMethodsOptions &&
            this.paymentMethodsOptions.length > 1 && (
              <InputField
                type="select"
                className="horizontal"
                label={intl.formatMessage(this.messages['creditcard.label'])}
                name="creditcardSelector"
                onChange={uuid => this.handleChange('creditcard', { uuid })}
                options={this.paymentMethodsOptions}
              />
            )}
          {showNewCreditCardForm && (
            <div>
              <InputField
                label={intl.formatMessage(this.messages['creditcard.label'])}
                type="creditcard"
                name="creditcard"
                className="horizontal"
                onChange={creditcardObject =>
                  this.handleChange('creditcard', creditcardObject)
                }
              />
            </div>
          )}
          <div>
            {!ocCard.expanded && (
              <Row key="giftcard.checkbox">
                <Col sm={2} />
                <Col sm={10}>
                  <a
                    className="gift-card-expander"
                    onClick={this.expandGiftCard}
                  >
                    <FormattedMessage
                      id="paymentMethod.useGiftCard"
                      defaultMessage="Use a Gift Card"
                    />
                  </a>
                </Col>
              </Row>
            )}
            {ocCard.expanded && (
              <Row key="ocCard.input">
                <Col sm={12}>
                  <InputField className="horizontal" {...inputOcCard} />
                </Col>
              </Row>
            )}
          </div>
        </Col>
      </Row>
    );
  };

  render() {
    const { intl, collective, LoggedInUser } = this.props;
    const { order, fromCollective } = this.state;
    const currency = (order.tier && order.tier.currency) || collective.currency;

    this.populatePaymentMethodTypes(collective.host);

    const requireLogin = !this.state.isNewUser && !LoggedInUser;
    const inputEmail = {
      type: 'email',
      name: 'email',
      focus: true,
      required: true,
      label: `${intl.formatMessage(this.messages['email.label'])}*`,
      description: intl.formatMessage(this.messages['email.description']),
      defaultValue: order['email'],
      onChange: value => this.handleChange('user', 'email', value),
    };
    if (!this.state.isNewUser) {
      inputEmail.button = (
        <Button onClick={this.signin} focus={true}>
          Login
        </Button>
      );
      if (!this.state.loginSent) {
        inputEmail.description = intl.formatMessage(
          this.messages['email.description.login'],
        );
      } else {
        inputEmail.button = <Button disabled={true}>Login</Button>;
        inputEmail.description = intl.formatMessage(
          this.messages['email.description.signup'],
        );
      }
    }

    return (
      <div className="OrderForm">
        <style jsx global>
          {`
            .ocCard span {
              max-width: 350px;
            }
            .OrderForm span.input-group,
            .OrderForm .help-block {
              max-width: 500px;
            }
            .OrderForm textarea[name='publicMessage'] {
              height: 10rem;
            }
          `}
        </style>
        <style jsx>
          {`
            .OrderForm {
              margin: 0 auto;
            }
            .userDetailsForm {
              overflow: hidden;
            }
            .paymentDetails {
              overflow: hidden;
            }
            .OrderForm :global(.tier) {
              margin: 0 0 1rem 0;
            }
            label {
              max-width: 100%;
              padding-right: 1rem;
            }
            .result {
              margin-top: 3rem;
            }
            .result div {
              width: 100%;
            }
            .error {
              color: red;
              font-weight: bold;
            }
            .value {
              padding-top: 7px;
              display: inline-block;
            }
            p {
              margin-top: -2.5rem;
              color: #737373;
            }
            .gift-card-expander {
              color: ${colors.blue};
              margin-left: 205px;
            }
            .info {
              margin-top: 3px;
            }
            .manualPaymentMethod .instructions {
              max-width: 50rem;
            }
            .manualPaymentMethod :global(code) {
              display: block;
              color: black;
              border: 1px solid #99c2ff;
              background: #ebf3ff;
            }
            #paypal-checkout {
              padding-top: 30px;
            }
            .form-group#paypalFG {
              margin-bottom: 0px !important;
            }
            .submit {
              display: flex;
              align-items: center;
            }
            .pleasewait {
              margin-left: 2rem;
              font-size: 1.4rem;
            }
          `}
        </style>
        <Form horizontal>
          <section className="userDetailsForm">
            <SectionTitle
              section="userDetails"
              subtitle={
                <div>
                  {order.tier.type !== 'TICKET' &&
                    !LoggedInUser && (
                      <FormattedMessage
                        id="tier.order.userdetails.description"
                        defaultMessage="If you wish to remain anonymous, only provide an email address without any other personal details."
                      />
                    )}
                  {order.tier.type !== 'TICKET' &&
                    LoggedInUser && (
                      <FormattedMessage
                        id="tier.order.userdetails.description.loggedin"
                        defaultMessage="If you wish to remain anonymous, logout and use another email address without providing any other personal details."
                      />
                    )}
                </div>
              }
            />

            {!LoggedInUser && (
              <Row key="email.input">
                <Col sm={12}>
                  <InputField className="horizontal" {...inputEmail} />
                </Col>
              </Row>
            )}
            {!LoggedInUser &&
              this.state.isNewUser &&
              this.fields.map(field => (
                <Row key={`${field.name}.input`}>
                  <Col sm={12}>
                    <InputField
                      className="horizontal"
                      {...field}
                      defaultValue={this.state.user[field.name]}
                      onChange={value =>
                        this.handleChange('user', field.name, value)
                      }
                    />
                  </Col>
                </Row>
              ))}

            {!requireLogin &&
              this.fromCollectiveOptions.length > 1 && (
                <InputField
                  className="horizontal"
                  type="select"
                  label={intl.formatMessage(
                    this.messages[
                      order.tier.type === 'TICKET'
                        ? 'order.rsvpAs'
                        : 'order.contributeAs'
                    ],
                  )}
                  name="fromCollectiveSelector"
                  onChange={CollectiveId => this.selectProfile(CollectiveId)}
                  options={this.fromCollectiveOptions}
                  defaultValue={get(order, 'fromCollective.id')}
                />
              )}

            {!LoggedInUser &&
              this.state.isNewUser &&
              (get(collective, 'tags') || []).includes('open source') && (
                <Row key="newsletterOptIn.input">
                  <Col sm={12}>
                    <InputField
                      className="horizontal"
                      name="newsletterOptIn"
                      type="checkbox"
                      help="Receive our monthly newsletter with updates about new collectives and features. Stay in the know with the latest sponsor and backer funding leaderboard, open source inspiration, and upcoming events."
                      description={intl.formatMessage(
                        this.messages['newsletterOptIn.description'],
                      )}
                      defaultValue={this.state.user['newsletterOptIn']}
                      onChange={value =>
                        this.handleChange('user', 'newsletterOptIn', value)
                      }
                    />
                  </Col>
                </Row>
              )}
          </section>

          {!fromCollective.id &&
            this.state.orgDetails.show && (
              <CreateOrganizationForm
                onChange={org => this.handleChange('fromCollective', org)}
              />
            )}

          {!requireLogin && (
            <div>
              <section className="order">
                {order.tier.type !== 'TICKET' && (
                  <SectionTitle section="contributionDetails" />
                )}
                {order.tier.type === 'TICKET' && (
                  <div>
                    <SectionTitle section="ticketDetails" />
                    <Row>
                      <Col sm={12}>
                        <div className="form-group">
                          <label className="col-sm-2 control-label">
                            <FormattedMessage
                              id="tier.order.ticket.info"
                              defaultMessage="Event info"
                            />
                          </label>
                          <Col sm={10}>
                            <div className="info">
                              {!collective.startsAt &&
                                console.warn(
                                  `OrderForm: collective.startsAt should not be empty. collective.id: ${
                                    collective.id
                                  }`,
                                )}
                              {collective.startsAt && (
                                <React.Fragment>
                                  <FormattedDate
                                    value={collective.startsAt}
                                    timeZone={collective.timezone}
                                    weekday="short"
                                    day="numeric"
                                    month="long"
                                  />
                                  , &nbsp;
                                  <FormattedTime
                                    value={collective.startsAt}
                                    timeZone={collective.timezone}
                                  />
                                  &nbsp; - &nbsp;
                                </React.Fragment>
                              )}
                              {get(collective, 'location.name')}
                            </div>
                          </Col>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
                <Row>
                  <Col sm={12}>
                    <div className="form-group">
                      <label className="col-sm-2 control-label">
                        {order.tier.type !== 'TICKET' && (
                          <FormattedMessage
                            id="tier.order.contribution"
                            defaultMessage="Contribution"
                          />
                        )}
                        {order.tier.type === 'TICKET' && (
                          <FormattedMessage
                            id="tier.order.ticket"
                            defaultMessage="Ticket"
                          />
                        )}
                      </label>
                      <Col sm={10}>
                        <TierComponent
                          tier={order.tier}
                          values={{
                            quantity: order.tier.quantity || order.quantity, // TODO: confusing, need to fix
                            interval: order.interval || order.tier.interval,
                            amount: order.totalAmount,
                          }}
                          onChange={tier =>
                            this.handleChange('order', 'tier', tier)
                          }
                        />
                      </Col>
                    </div>
                  </Col>
                </Row>
                {this.props.matchingFund && (
                  <Row>
                    <Col sm={12}>
                      <MatchingFundWithData
                        collective={collective}
                        order={order}
                        uuid={this.props.matchingFund}
                        onChange={matchingFund =>
                          this.handleChange(
                            'order',
                            'matchingFund',
                            matchingFund,
                          )
                        }
                      />
                    </Col>
                  </Row>
                )}
                <Row>
                  <Col sm={12}>
                    <InputField
                      label="Message (public)"
                      type="textarea"
                      name="publicMessage"
                      className="horizontal"
                      placeholder={intl.formatMessage(
                        this.messages['order.publicMessage.placeholder'],
                      )}
                      defaultValue={order.publicMessage}
                      maxLength={255}
                      onChange={value =>
                        this.handleChange('order', 'publicMessage', value)
                      }
                    />
                  </Col>
                </Row>
              </section>

              {order.totalAmount > 0 && (
                <section className="paymentDetails">
                  <SectionTitle section="paymentDetails" />

                  {this.paymentMethodTypeOptions.length > 1 && (
                    <Row>
                      <Col sm={12}>
                        <InputField
                          className="horizontal"
                          type="select"
                          name="paymentMethodTypeSelector"
                          options={this.paymentMethodTypeOptions}
                          label={intl.formatMessage(
                            this.messages['paymentMethod.type'],
                          )}
                          onChange={value =>
                            this.handleChange('paymentMethod', 'type', value)
                          }
                        />
                      </Col>
                    </Row>
                  )}

                  {this.state.paymentMethod.type === 'creditcard' &&
                    this.renderCreditCard()}
                  {this.state.paymentMethod.type === 'payment' &&
                    this.renderPayPalButton()}
                  {this.state.paymentMethod.type === 'manual' && (
                    <div className="horizontal form-group manualPaymentMethod ">
                      <label className="col-sm-2 control-label" />
                      <div
                        className="col-sm-10 instructions"
                        dangerouslySetInnerHTML={{
                          __html: intl.formatMessage(
                            {
                              id: 'host.paymentMethod.manual.instructions',
                              defaultMessage: get(
                                collective.host,
                                'settings.paymentMethods.manual.instructions',
                              ),
                            },
                            {
                              amount: formatCurrency(
                                order.totalAmount,
                                order.tier.currency,
                              ),
                              email: get(this.state, 'user.email', '').replace(
                                '@',
                                ' at ',
                              ),
                              collective: collective.slug,
                              TierId: order.tier.id,
                            },
                          ),
                        }}
                      />
                    </div>
                  )}
                </section>
              )}

              {this.state.paymentMethod.type !== 'manual' && (
                <Row key="summary-info">
                  <Col sm={2} />
                  <Col sm={10}>
                    {order.totalAmount > 0 &&
                      !collective.host && (
                        <div className="error">
                          <FormattedMessage
                            id="order.error.hostRequired"
                            defaultMessage="This collective doesn't have a host that can receive money on their behalf"
                          />
                        </div>
                      )}

                    {(collective.host || order.totalAmount === 0) &&
                      !this.isPayPalSelected() && (
                        <div className="actions">
                          <div className="submit">
                            <ActionButton
                              className="blue"
                              onClick={this.handleSubmit}
                              disabled={this.state.loading}
                            >
                              {this.state.loading ? (
                                <FormattedMessage
                                  id="form.processing"
                                  defaultMessage="processing"
                                />
                              ) : (
                                order.tier.button ||
                                capitalize(
                                  intl.formatMessage(
                                    this.messages['order.button'],
                                  ),
                                )
                              )}
                            </ActionButton>
                            {this.state.loading && (
                              <div className="pleasewait">
                                <FormattedMessage
                                  id="pleasewait"
                                  defaultMessage="Please wait..."
                                />
                                ...
                              </div>
                            )}
                          </div>

                          {order.totalAmount > 0 &&
                            this.renderDisclaimer({
                              hostname: collective.host.name,
                              amount: formatCurrency(
                                order.totalAmount,
                                currency,
                              ),
                              interval: order.interval || order.tier.interval,
                              collective: collective.name,
                            })}

                          <div className="result">
                            {this.state.result.success && (
                              <div className="success">
                                {this.state.result.success}
                              </div>
                            )}
                            {this.state.result.error && (
                              <div className="error">
                                {this.state.result.error}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Form>
      </div>
    );
  }
}

export default withIntl(withApollo(OrderForm));
