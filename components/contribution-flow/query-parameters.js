import UrlQueryHelper from '../../lib/UrlQueryHelper';

const ContributionFlowUrlParametersConfig = {
  // ---- Public fields ----
  // Contribution
  amount: { type: 'amount' },
  platformTip: { type: 'amount' },
  quantity: { type: 'integer' },
  interval: { type: 'interval' },
  description: { type: 'string' },
  // Profile
  contributeAs: { type: 'string' },
  email: { type: 'string' },
  name: { type: 'string' },
  // Payment
  hideCreditCardPostalCode: { type: 'boolean' },
  disabledPaymentMethodTypes: { type: 'stringArray' },
  // Success
  redirect: { type: 'string' },
  // Misc metadata
  data: { type: 'json' },
  tags: { type: 'stringArray' },
  // ---- Aliases for legacy compatibility ----
  totalAmount: { type: 'alias', on: 'amount', modifier: value => Math.round(value / 100) },
  platformContribution: { type: 'alias', on: 'platformTip' },
  defaultEmail: { type: 'alias', on: 'email' },
  defaultName: { type: 'alias', on: 'name' },
  // ---- Deprecated fields ----
  skipStepDetails: { type: 'boolean' },
};

const EmbedContributionFlowUrlParametersConfig = {
  ...ContributionFlowUrlParametersConfig,
  hideFAQ: { type: 'boolean' },
  hideHeader: { type: 'boolean' },
  backgroundColor: { type: 'color' },
  useTheme: { type: 'boolean' },
};

export const ContributionFlowUrlQueryHelper = new UrlQueryHelper(ContributionFlowUrlParametersConfig);
export const EmbedContributionFlowUrlQueryHelper = new UrlQueryHelper(EmbedContributionFlowUrlParametersConfig);
