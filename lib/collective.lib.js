import { get, trim } from 'lodash';
import slugify from 'slugify';

import {
  CollectiveCategory,
  CollectiveTagsCategories,
  CollectiveType,
  OPENSOURCE_COLLECTIVE_ID,
} from './constants/collectives';
import { ProvidersWithRecurringPaymentSupport } from './constants/payment-methods';
import MEMBER_ROLE from './constants/roles';

/**
 * For a given host and/or a list of tags, returns the main tag for the category of the
 * collective. If none matches, defaults to `CollectiveCategory.COLLECTIVE`
 */
export const getCollectiveMainTag = (hostCollectiveId = null, tags = [], type, settings = null) => {
  // All collectives from "Open Source Collective 501c3" are set to "Open source" category
  if (hostCollectiveId === OPENSOURCE_COLLECTIVE_ID) {
    return CollectiveCategory.OPEN_SOURCE;
  }

  // Try to guess the main category from tags
  if (tags) {
    const tagWithCategory = tags.find(tag => CollectiveTagsCategories[tag]);
    if (tagWithCategory) {
      const category = CollectiveTagsCategories[tagWithCategory];
      return CollectiveCategory[category];
    }
  }

  // Try to get from the type
  if (type === CollectiveType.EVENT) {
    return CollectiveCategory.EVENT;
  } else if (type === CollectiveType.ORGANIZATION) {
    return CollectiveCategory.ORGANIZATION;
  } else if (type === CollectiveType.USER) {
    return CollectiveCategory.USER;
  } else if (type === CollectiveType.PROJECT) {
    return CollectiveCategory.PROJECT;
  } else if (type === CollectiveType.FUND) {
    return CollectiveCategory.FUND;
  }

  // Funds MVP, to refactor
  if (settings && settings.fund) {
    return CollectiveCategory.FUND;
  }

  // Default to 'Collective'
  return CollectiveCategory.COLLECTIVE;
};

export const expenseSubmissionAllowed = (collective, user) => {
  if (!collective?.settings?.disablePublicExpenseSubmission) {
    return true;
  } else {
    const member = user?.memberOf.filter(member => member.collective.slug === collective.slug);
    return member?.length > 0;
  }
};

export const getCollectiveTypeForUrl = collective => {
  if (!collective) {
    return;
  }

  if (collective.type === 'EVENT') {
    return 'events';
  }
  if (collective.type === 'PROJECT') {
    return 'projects';
  }
};

export const hostIsTaxDeductibeInTheUs = host => {
  return get(host, 'settings.taxDeductibleDonations');
};

export const suggestSlug = value => {
  const slugOptions = {
    replacement: '-',
    lower: true,
    strict: true,
  };

  return trim(slugify(value, slugOptions), '-');
};

export const getTopContributors = contributors => {
  const topOrgs = [];
  const topIndividuals = [];

  for (const contributor of contributors) {
    // We only care about financial contributors that donated $$$
    if (!contributor.isBacker || !contributor.totalAmountDonated) {
      continue;
    }

    // Put contributors in the array corresponding to their types
    if (contributor.type === CollectiveType.USER) {
      topIndividuals.push(contributor);
    } else if (
      [CollectiveType.ORGANIZATION, CollectiveType.COLLECTIVE, CollectiveType.FUND].includes(contributor.type)
    ) {
      topOrgs.push(contributor);
    }

    if (topIndividuals.length >= 10 && topOrgs.length >= 10) {
      break;
    }
  }

  // If one of the two categories is not filled, complete with more contributors from the other
  const nbColsPerCategory = 2;
  const nbFreeColsFromOrgs = nbColsPerCategory - Math.ceil(topOrgs.length / 5);
  const nbFreeColsFromIndividuals = nbColsPerCategory - Math.ceil(topOrgs.length / 5);
  let takeNbOrgs = 10;
  let takeNbIndividuals = 10;

  if (nbFreeColsFromOrgs > 0) {
    takeNbIndividuals += nbFreeColsFromOrgs * 5;
  } else if (nbFreeColsFromIndividuals > 0) {
    takeNbOrgs += nbFreeColsFromIndividuals * 5;
  }

  return [topOrgs.slice(0, takeNbOrgs), topIndividuals.slice(0, takeNbIndividuals)];
};

export const isEmptyCollectiveLocation = account => {
  if (!account?.location) {
    return true;
  } else {
    const { name, address, country, lat, long } = account.location;
    return !(address || country || (lat && long)) && name !== 'Online';
  }
};

export const getContributeRoute = collective => {
  let pathname = `/${collective.slug}/donate`;
  if (
    get(collective, 'settings.disableCustomContributions', false) ||
    get(collective, 'settings.disableCryptoContributions', true)
  ) {
    if (collective.tiers && collective.tiers.length > 0) {
      const tier = collective.tiers[0];
      pathname = `/${collective.slug}/contribute/${tier.slug}-${tier.id}/checkout`;
    } else {
      return null;
    }
  }
  return pathname;
};

export const getSuggestedTags = collective => {
  return collective?.expensesTags?.map(({ tag }) => tag) || [];
};

/** Checks if recurring contributions are allowed for the user for a given collective **/
export const canContributeRecurring = (collective, user) => {
  // If the host has a payment method that supports recurring payments (PayPal, Credit Card, etc.)
  const paymentProviderSupportRecurring = pm => ProvidersWithRecurringPaymentSupport.includes(pm);
  if (collective.host.supportedPaymentMethods.some(paymentProviderSupportRecurring)) {
    return true;
  }

  // Otherwise the only other option to contribute recurring is if the user is an admin of another collective under the same host
  const hostId = collective.host.legacyId;
  const collectiveId = collective.legacyId;
  return Boolean(
    user?.memberOf.some(
      member =>
        member.collective?.host?.id === hostId && // Must be under the same host
        member.collective.id !== collectiveId && // Must not be the same collective
        member.role === MEMBER_ROLE.ADMIN,
    ),
  );
};

/*
 * Displays the name string as "Legal name (Display name)" if legal name exists.
 * Example: Sudharaka (Suds)
 */
export const formatAccountName = (legalName, displayName) => {
  if (legalName && legalName !== displayName) {
    return `${legalName} (${displayName})`;
  } else {
    return displayName;
  }
};

/*
 * Validate the account holder name against the legal name. Following cases are considered a match,
 *
 * 1) Punctuation are ignored; "Evil Corp, Inc" and "Evil Corp, Inc." are considered a match.
 * 2) Accents are ignored; "François" and "Francois" are considered a match.
 * 3) The first name and last name order is ignored; "Benjamin Piouffle" and "Piouffle Benjamin" is considered a match.
 */
export const compareNames = (accountHolderName, legalName) => {
  // Ignore 501(c)(3) in both account holder name and legal name
  legalName = legalName.replaceAll('501(c)(3)', '');
  accountHolderName = accountHolderName.replaceAll('501(c)(3)', '');

  const namesArray = legalName.trim().split(' ');
  let legalNameReversed;
  if (namesArray.length === 2) {
    const firstName = namesArray[0];
    const lastName = namesArray[1];
    legalNameReversed = `${lastName} ${firstName}`;
  }
  return !(
    accountHolderName.localeCompare(legalName, undefined, {
      sensitivity: 'base',
      ignorePunctuation: true,
    }) &&
    accountHolderName.localeCompare(legalNameReversed, undefined, {
      sensitivity: 'base',
      ignorePunctuation: true,
    })
  );
};

/* Returns true if the account is a fiscal host. Returns false for self-hosted accounts */
export const isHostAccount = c => c.isHost === true && c.type !== 'COLLECTIVE';

/* Returns true if the account is self-hosted */
export const isSelfHostedAccount = c => c.isHost === true && c.type === 'COLLECTIVE';

/* Returns true if the account is an individual. Works with GQLV1 (Collectives) & GQLV2 (Accounts) */
export const isIndividualAccount = account => ['USER', 'INDIVIDUAL'].includes(account.type);

/* Checks whether an account supports grants */
export const accountSupportsGrants = (collectiveSettings, hostSettings) => {
  return get(collectiveSettings, 'expenseTypes.hasGrant', !get(hostSettings, 'disableGrantsByDefault', false));
};
