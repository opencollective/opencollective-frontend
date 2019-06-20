import React from 'react';
import { defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import styled, { css } from 'styled-components';

import StyledButton from './StyledButton';
import { Span } from './Text';
import withIntl from '../lib/withIntl';

export const CONTRIBUTOR_FILTERS = {
  ALL: 'ALL',
  CORE: 'CORE',
  FINANCIAL: 'FINANCIAL',
};

const FILTERS_LIST = Object.values(CONTRIBUTOR_FILTERS);

const Translations = defineMessages({
  [CONTRIBUTOR_FILTERS.ALL]: {
    id: 'ContributorsFilter.All',
    defaultMessage: 'All contributors',
  },
  [CONTRIBUTOR_FILTERS.CORE]: {
    id: 'ContributorsFilter.Core',
    defaultMessage: 'Core contributors',
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
    if (c.isCore) {
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
    return contributors.filter(c => c.isCore);
  } else {
    // For filters not implemented yet and `ALL`, just return the contributors list
    return contributors;
  }
};

/**
 * An individual filtering button
 */
const FilterBtn = styled(({ filter, isSelected, onChange, ...props }) => {
  return (
    <StyledButton
      onClick={isSelected ? undefined : () => onChange(filter)}
      buttonStyle={isSelected ? 'dark' : 'standard'}
      {...props}
    />
  );
})`
  margin: 0 8px;

  ${props =>
    !props.isSelected &&
    css`
    bg: '#F5F7FA',
    color: '#4E5052',
    border: '1px solid #F5F7FA',
  `}
`;

/**
 * A set of filters for contributors types. This file also exports helper functions
 * to deal with the filters, incuding:
 * - `getContributorsFilters`: For a given list of Contributors, returns all the filters that can be applied to the list.
 * - `filterContributors`: A helper to filter a Contributors list by contributor roles.
 */
const ContributorsFilter = ({ intl, selected, onChange, filters }) => {
  const activeFilter = selected || CONTRIBUTOR_FILTERS.ALL;
  return (
    <Flex css={{ overflowX: 'auto' }}>
      {filters.map(filter => {
        return (
          <FilterBtn key={filter} filter={filter} onChange={onChange} isSelected={filter === activeFilter}>
            <Span textTransform="capitalize" whiteSpace="nowrap">
              {intl.formatMessage(Translations[filter])}
            </Span>
          </FilterBtn>
        );
      })}
    </Flex>
  );
};

ContributorsFilter.propTypes = {
  /** Selected filter. Defaults to `ALL` */
  selected: PropTypes.oneOf(FILTERS_LIST),
  /** Called when another filter is selected */
  onChange: PropTypes.func.isRequired,
  /** An optional list of active filters */
  filters: PropTypes.arrayOf(PropTypes.oneOf(FILTERS_LIST)),
  /** @ignore from withIntl */
  intl: PropTypes.object,
};

ContributorsFilter.defaultProps = {
  filters: FILTERS_LIST,
};

export default withIntl(ContributorsFilter);
