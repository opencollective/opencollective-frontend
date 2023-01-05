import { assign, pick } from 'lodash';

import UrlQueryHelper from '../../lib/UrlQueryHelper';

/**
 * These attributes are documented using JSDoc to automatically generate
 * documentation for the contribution flow. You can re-generate them by running:
 * `npm run docs:generate:contribution-flow`
 */
const ContributionFlowUrlParametersConfig = {
  // ---- Public fields ----
  // -- Contribution
  /**
   * Default contribution amount
   * @example 42.42
   */
  amount: { type: 'amount' },
  /**
   * Default number of units (for products and tickets only)
   * @default 1
   * @example 5
   */
  quantity: { type: 'integer' },
  /**
   * The contribution interval (must be supported by the selected tier, if any)
   * @example 'month'
   */
  interval: { type: 'interval' },
  /**
   * A custom description
   */
  description: { type: 'string' },
  /**
   * ID of the payment method to use. Will fallback to another payment method if not available.
   */
  paymentMethod: { type: 'string' },
  // -- Profile
  /**
   * Slug of the default profile to use to contribute
   * @default Logged in user personal profile
   */
  contributeAs: { type: 'string' },
  /**
   * Guest contributions only: The email to use to contribute
   * @example test@opencollective.com
   */
  email: { type: 'string' },
  /**
   * Guest contributions only: The name to use to contribute
   * @example John Doe
   */
  name: { type: 'string' },
  /**
   * Guest contributions only: The legal name to use to contribute
   * @example John Doe
   */
  legalName: { type: 'string' },
  // -- Payment
  /** @private */
  hideCreditCardPostalCode: { type: 'boolean' },
  /**
   * To disable specific payment method types
   * @example MANUAL,BANK_TRANSFER
   */
  disabledPaymentMethodTypes: { type: 'stringArray' },
  // -- Success
  /**
   * The URL to redirect to after a successful contribution
   * @example https://www.example.com/thank-you
   */
  redirect: { type: 'string' },
  // -- Misc metadata
  /** @private */
  customData: { type: 'json' },
  /**
   * Some tags to attach to the contribution
   * @example tag1,tag2
   */
  tags: { type: 'stringArray' },
  /** To hide the steps on top. Will also hide the "previous" button on step payment */
  hideSteps: { type: 'boolean' },
  // ---- Aliases for legacy compatibility ----
  /**
   * The default amount in cents
   * @deprecated Use `amount` instead
   * @example 4200
   */
  totalAmount: { type: 'alias', on: 'amount', modifier: value => Math.round(value / 100) },
  /** @deprecated Use `email` instead */
  defaultEmail: { type: 'alias', on: 'email' },
  /** @deprecated Use `name` instead */
  defaultName: { type: 'alias', on: 'name' },
  /** Cryptocurrency type; BTC, ETH etc **/
  cryptoCurrency: { type: 'string' },
  /** Cryptocurrency amount **/
  cryptoAmount: { type: 'float' },
};

const EmbedContributionFlowUrlParametersConfig = {
  ...ContributionFlowUrlParametersConfig,
  /**
   * Whether we need to hide the right-column FAQ
   * @default false
   * @example true
   */
  hideFAQ: { type: 'boolean' },
  /**
   * Whether we need to hide the contribution flow header
   * @default false
   * @example true
   */
  hideHeader: { type: 'boolean' },
  /**
   * A custom color to use as the background color of the contribution flow
   * @example #ff0000
   */
  backgroundColor: { type: 'color' },
  /**
   * Whether to use the collective theme (custom colors)
   * @default false
   * @example true
   */
  useTheme: { type: 'boolean' },
};

/**
 * Returns an un-sanitized version of the URL query parameters
 */
export const stepsDataToUrlParamsData = (previousUrlParams, stepDetails, stepProfile, stepPayment, isCrypto) => {
  const data = pick(previousUrlParams, ['redirect', 'hideFAQ', 'hideHeader', 'backgroundColor', 'useTheme']);

  // Step details
  assign(data, pick(stepDetails, ['interval', 'quantity', 'customData']));

  if (!isCrypto) {
    data.amount = stepDetails.amount;
  }

  // Step profile
  if (stepProfile?.slug) {
    data.contributeAs = stepProfile.slug;
  } else {
    assign(data, pick(stepProfile, ['name', 'legalName', 'email']));
  }

  // Step payment
  if (stepPayment?.key) {
    data.paymentMethod = stepPayment.key;
  }

  // Remove entries that are set to their default values
  if (data.quantity === 1) {
    delete data.quantity;
  }

  if (isCrypto) {
    data.cryptoAmount = parseFloat(stepDetails.cryptoAmount) || previousUrlParams.cryptoAmount || 0;
    data.cryptoCurrency = stepDetails.currency?.value ? stepDetails.currency.value : previousUrlParams.cryptoCurrency;
    delete data.amount;
  } else {
    delete data.cryptoAmount;
  }

  return data;
};

export const ContributionFlowUrlQueryHelper = new UrlQueryHelper(ContributionFlowUrlParametersConfig);
export const EmbedContributionFlowUrlQueryHelper = new UrlQueryHelper(EmbedContributionFlowUrlParametersConfig);
