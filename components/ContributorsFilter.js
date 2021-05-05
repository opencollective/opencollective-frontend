import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import StyledFilters from './StyledFilters';

export const CONTRIBUTOR_FILTERS = {
  ALL: 'ALL',
  CORE: 'CORE',
  FINANCIAL: 'FINANCIAL',
};

export const FILTERS_LIST = Object.values(CONTRIBUTOR_FILTERS);

const Translations = defineMessages({
  [CONTRIBUTOR_FILTERS.ALL]: {
    id: 'ContributorsFilter.All',
    defaultMessage: 'All contributors',
  },
  [CONTRIBUTOR_FILTERS.CORE]: {
    id: 'ContributorsFilter.Core',
    defaultMessage: 'Team',
  },
  [CONTRIBUTOR_FILTERS.FINANCIAL]: {
    id: 'ContributorsFilter.Financial',
    defaultMessage: 'Financial contributors',
  },
  [CONTRIBUTOR_FILTERS.GITHUB]: {
    id: 'ContributorsFilter.Github',
    defaultMessage: 'Github contributors',
  },
});

/**
 * For a given list of contributors, returns all the filters that can be applied
 * to the list.
 */
export const getContributorsFilters = contributors => {
  const filters = new Set([CONTRIBUTOR_FILTERS.ALL]);

  // Helper to add a filter, returns true if the filters list is full because there's
  // no need to traverse the entire list if we already registered all the types
  const addFilter = filter => {
    filters.add(filter);
    return filters.length === FILTERS_LIST.length - 1;
  };

  // Add filters to the set based on contributors roles
  for (const c of contributors) {
    if (c.isCore || c.isAdmin) {
      if (addFilter(CONTRIBUTOR_FILTERS.CORE)) {
        break;
      }
    } else if (c.isBacker || c.isFundraiser) {
      if (addFilter(CONTRIBUTOR_FILTERS.FINANCIAL)) {
        break;
      }
    }
  }

  // Ensure we preserver filters order by sorting them according to the base list
  return Array.from(filters).sort((filter1, filter2) => {
    return FILTERS_LIST.indexOf(filter1) > FILTERS_LIST.indexOf(filter2) ? 1 : -1;
  });
};

/**
 * A helper to filter a contributors list by contributor roles.
 *
 * Please ensure you memoize this one properly is the cost can be pretty depending
 * on the number of contributors.
 */
export const filterContributors = (contributors, filter) => {
  if (!contributors) {
    return [];
  }

  if (filter === CONTRIBUTOR_FILTERS.FINANCIAL) {
    return contributors.filter(c => c.isBacker || c.isFundraiser);
  } else if (filter === CONTRIBUTOR_FILTERS.CORE) {
    return contributors.filter(c => c.isCore || c.isAdmin);
  } else {
    // For filters not implemented yet and `ALL`, just return the contributors list
    return contributors;
  }
};

/**
 * A set of filters for contributors types. This file also exports helper functions
 * to deal with the filters, including:
 * - `getContributorsFilters`: For a given list of Contributors, returns all the filters that can be applied to the list.
 * - `filterContributors`: A helper to filter a Contributors list by contributor roles.
 */
const ContributorsFilter = ({ intl, selected, onChange, filters, selectedButtonStyle, ...props }) => {
  return (
    <StyledFilters
      filters={filters}
      getLabel={filter => intl.formatMessage(Translations[filter])}
      onChange={onChange}
      selected={selected || CONTRIBUTOR_FILTERS.ALL}
      selectedButtonStyle={selectedButtonStyle}
      {...props}
    />
  );
};

ContributorsFilter.propTypes = {
  /** Selected filter. Defaults to `ALL` */
  selected: PropTypes.oneOf(FILTERS_LIST),
  /** Called when another filter is selected */
  onChange: PropTypes.func.isRequired,
  /** An optional list of active filters */
  filters: PropTypes.arrayOf(PropTypes.oneOf(FILTERS_LIST)),
  /** Default button style when selected */
  selectedButtonStyle: PropTypes.oneOf(['primary', 'secondary', 'standard', 'dark']),
  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

ContributorsFilter.defaultProps = {
  filters: FILTERS_LIST,
  selectedButtonStyle: 'dark',
};

export default injectIntl(ContributorsFilter);
