/**
 * A set of helpers to manage the state of the contribution flow.
 */

import INTERVALS from '../../lib/constants/intervals';
import { getDefaultInterval, getDefaultTierAmount } from '../../lib/tier-utils';

import { getContributeProfiles } from './utils';

export type ContributionFlowFormikValues = {
  stepProfile: null | {
    isGuest: boolean;
    email: string;
    name: string;
    legalName: string;
  };
  stepPayment: null;
  stepSummary: null;
  stepDetails: null | {
    quantity: number;
    interval: INTERVALS;
    amount: number;
    platformTip: number;
    currency: string;
    customData?: Record<string, unknown>;
  };
};

const getDefaultStepProfile = (queryParams, LoggedInUser, loadingLoggedInUser, collective, tier) => {
  const profiles = getContributeProfiles(LoggedInUser, collective, tier);

  // We want to wait for the user to be logged in before matching the profile
  if (loadingLoggedInUser) {
    return { slug: queryParams.contributeAs };
  }

  // If there's a default profile slug, enforce it
  if (queryParams.contributeAs) {
    const contributorProfile = profiles.find(({ slug }) => slug === queryParams.contributeAs);
    if (contributorProfile) {
      return contributorProfile;
    }
  }

  // Otherwise to the logged-in user personal profile, if any
  if (profiles[0]) {
    return profiles[0];
  }

  // Otherwise, it's a guest contribution
  return {
    isGuest: true,
    email: queryParams.email || '',
    name: queryParams.name || '',
    legalName: queryParams.legalName || '',
  };
};

const getDefaultStepDetails = (queryParams, collective, tier, currency, isCryptoFlow) => {
  return {
    quantity: queryParams.quantity || 1,
    interval: queryParams.interval || getDefaultInterval(tier),
    amount: isCryptoFlow ? '' : queryParams.amount || getDefaultTierAmount(tier, collective, currency),
    platformTip: queryParams.platformTip,
    currency,
  };
};

export const queryParamsToFormikState = (
  queryParams: Record<string, unknown>,
  LoggedInUser,
  loadingLoggedInUser,
  collective,
  tier,
  currency,
  isCryptoFlow,
): ContributionFlowFormikValues => {
  return {
    stepDetails: getDefaultStepDetails(queryParams, collective, tier, currency, isCryptoFlow),
    stepProfile: getDefaultStepProfile(queryParams, LoggedInUser, loadingLoggedInUser, collective, tier),
    stepSummary: null,
    stepPayment: null,
  };
};
