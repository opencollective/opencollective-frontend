import { assign, pick } from 'lodash';

import UrlQueryHelper from '../../lib/UrlQueryHelper';

import { INCOGNITO_PROFILE_ALIAS, PERSONAL_PROFILE_ALIAS } from './constants';

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
   * @example test@doohicollective.org
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
  hideCreditCardPostalCode: { type: 'boolean', static: true },
  /**
   * To disable specific payment method types
   * @example "MANUAL", "BANK_TRANSFER", "PAYMENT" (for PayPal)
   */
  disabledPaymentMethodTypes: { type: 'stringArray', static: true },
  // -- Success
  /**
   * The URL to redirect to after a successful contribution
   * @example https://www.example.com/thank-you
   */
  redirect: { type: 'string', static: true },
  // -- Misc metadata
  /** @private */
  customData: { type: 'json' },
  /**
   * Some tags to attach to the contribution
   * @example tag1,tag2
   */
  tags: { type: 'stringArray', static: true },
  /** To hide the steps on top. Will also hide the "previous" button on step payment */
  hideSteps: { type: 'boolean', static: true },
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
};

const EmbedContributionFlowUrlParametersConfig = {
  ...ContributionFlowUrlParametersConfig,
  /**
   * Whether we need to hide the right-column FAQ
   * @default false
   * @example true
   */
  hideFAQ: { type: 'boolean', static: true },
  /**
   * Whether we need to hide the contribution flow header
   * @default false
   * @example true
   */
  hideHeader: { type: 'boolean', static: true },
  /**
   * A custom color to use as the background color of the contribution flow
   * @example #ff0000
   */
  backgroundColor: { type: 'color', static: true },
  /**
   * Whether to use the collective theme (custom colors)
   * @default false
   * @example true
   */
  useTheme: { type: 'boolean', static: true },
  /**
   * Whether to redirect the parent of the iframe rather than the iframe itself. The `iframe` needs to have
   * its `sandbox` property set to `allow-top-navigation` for this to work.
   */
  shouldRedirectParent: { type: 'boolean', static: true },
};

// Params that are not meant to be changed during the flow and should be kept in the URL
const STATIC_PARAMS = Object.keys(ContributionFlowUrlParametersConfig).filter(
  key => ContributionFlowUrlParametersConfig[key].static,
);
const STATIC_PARAMS_EMBED = Object.keys(EmbedContributionFlowUrlParametersConfig).filter(
  key => EmbedContributionFlowUrlParametersConfig[key].static,
);

/**
 * Returns an un-sanitized version of the URL query parameters
 */
export const stepsDataToUrlParamsData = (
  loggedInUser,
  previousUrlParams,
  stepDetails,
  stepProfile,
  stepPayment,
  isEmbed,
) => {
  // Static params that are not meant to be changed during the flow
  const data = pick(previousUrlParams, isEmbed ? STATIC_PARAMS_EMBED : STATIC_PARAMS);

  // Step details
  assign(data, pick(stepDetails, ['interval', 'quantity', 'customData', 'amount']));

  // Step profile
  if (stepProfile.isIncognito) {
    data.contributeAs = INCOGNITO_PROFILE_ALIAS;
  } else if (stepProfile?.slug) {
    const isPersonalProfile = stepProfile.slug === loggedInUser?.collective?.slug;
    data.contributeAs = isPersonalProfile ? PERSONAL_PROFILE_ALIAS : stepProfile.slug;
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

  return data;
};

export const ContributionFlowUrlQueryHelper = new UrlQueryHelper(ContributionFlowUrlParametersConfig);
export const EmbedContributionFlowUrlQueryHelper = new UrlQueryHelper(EmbedContributionFlowUrlParametersConfig);
