const plans = {
  // Legacy Plans (automatically set for accounts created before 2020)
  'legacy-custom-host-plan': {
    hostedCollectivesLimit: 100,
    addedFundsLimit: 100000, // in dollar cents
    manualPayments: false,
    hostDashboard: true,
    level: 60,
  },
  'legacy-large-host-plan': {
    hostedCollectivesLimit: 25,
    addedFundsLimit: 100000, // in dollar cents
    manualPayments: false,
    hostDashboard: true,
    level: 50,
  },
  'legacy-medium-host-plan': {
    hostedCollectivesLimit: 10,
    addedFundsLimit: 100000, // in dollar cents
    manualPayments: false,
    hostDashboard: true,
    level: 40,
  },
  'legacy-small-host-plan': {
    hostedCollectivesLimit: 5,
    addedFundsLimit: 100000, // in dollar cents
    manualPayments: false,
    hostDashboard: true,
    level: 30,
  },
  'legacy-single-host-plan': {
    hostedCollectivesLimit: 1,
    addedFundsLimit: 100000, // in dollar cents
    manualPayments: false,
    hostDashboard: true,
    level: 20,
  },
  // Plans (for customers from 2020)
  // These keys must match OpenCollective's existing Tier slugs and their data
  // should be updated in our Tier database.
  'network-host-plan': {
    hostedCollectivesLimit: 100,
    addedFundsLimit: null,
    manualPayments: true,
    hostDashboard: true,
    level: 60,
  },
  'large-host-plan': {
    hostedCollectivesLimit: 25,
    addedFundsLimit: null,
    manualPayments: true,
    hostDashboard: true,
    level: 50,
  },
  'medium-host-plan': {
    hostedCollectivesLimit: 10,
    addedFundsLimit: null,
    manualPayments: true,
    hostDashboard: false,
    level: 40,
  },
  'small-host-plan': {
    hostedCollectivesLimit: 5,
    addedFundsLimit: null,
    manualPayments: true,
    hostDashboard: false,
    level: 30,
  },
  'single-host-plan': {
    hostedCollectivesLimit: 1,
    addedFundsLimit: null,
    manualPayments: true,
    hostDashboard: true,
    level: 20,
  },
  // Special plan for everyone without a plan
  default: {
    hostedCollectivesLimit: null,
    addedFundsLimit: 100000, // in dollar cents
    manualPayments: false,
    hostDashboard: true,
    level: 10,
  },
  // Special plan for Open Collective own Hosts
  owned: {
    hostedCollectivesLimit: null,
    addedFundsLimit: null,
    manualPayments: true,
    hostDashboard: true,
    level: 100,
  },
};

export const PLANS_COLLECTIVE_SLUG = 'opencollective';

export default plans;
