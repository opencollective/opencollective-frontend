import React from 'react';
import { defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import styled, { css } from 'styled-components';

import StyledButton from './StyledButton';
import { Span } from './Text';
import roles from '../constants/roles';
import withIntl from '../lib/withIntl';

export const CONTRIBUTOR_FILTERS = {
  ALL: 'ALL',
  CORE: 'CORE',
  FINANCIAL: 'FINANCIAL',
  GITHUB: 'GITHUB',
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
 * For a given list of members, returns all the filters that can be applied
 * to the list.
 */
export const getMembersFilters = members => {
  const filters = new Set([CONTRIBUTOR_FILTERS.ALL]);
  for (const m of members) {
    // Add role to the set
    if (m.role === roles.CONTRIBUTOR) {
      filters.add(CONTRIBUTOR_FILTERS.GITHUB);
    } else if (m.role === roles.ADMIN) {
      filters.add(CONTRIBUTOR_FILTERS.CORE);
    } else if ([roles.BACKER, roles.FUNDRAISER].includes(m.role)) {
      filters.add(CONTRIBUTOR_FILTERS.FINANCIAL);
    }

    // No need to traverse the entire list if we already registered all the types
    if (filters.length === FILTERS_LIST.length) {
      break;
    }
  }

  // Ensure we preserver filters order by sorting them according to the base list
  return Array.from(filters).sort((filter1, filter2) => {
    return FILTERS_LIST.indexOf(filter1) > FILTERS_LIST.indexOf(filter2) ? 1 : -1;
  });
};

/**
 * A helper to filter a members list by member type.
 */
export const filterMembers = (members, filter) => {
  if (!members) {
    return [];
  }

  if (filter === CONTRIBUTOR_FILTERS.FINANCIAL) {
    return members.filter(m => [roles.BACKER, roles.FUNDRAISER].includes(m.role));
  } else if (filter === CONTRIBUTOR_FILTERS.CORE) {
    return members.filter(m => m.role === roles.ADMIN);
  } else if (filter === CONTRIBUTOR_FILTERS.GITHUB) {
    return members.filter(m => m.role === roles.CONTRIBUTOR);
  } else {
    return members;
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
    backgroundColor: '#F5F7FA',
    color: '#4E5052',
    border: '1px solid #F5F7FA',
  `}
`;

/**
 * A set of filters for contributors types. This file also exports helper functions
 * to deal with the filters, incuding:
 * - `getMembersFilters`: For a given list of members, returns all the filters that can be applied to the list.
 * - `filterMembers`: A helper to filter a members list by member type.
 */
const ContributorsFilter = ({ intl, selected, onChange, filters }) => {
  return (
    <Flex css={{ overflowX: 'auto' }}>
      {filters.map(filter => {
        return (
          <FilterBtn key={filter} filter={filter} onChange={onChange} isSelected={filter === selected}>
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
  /** Selected filter */
  selected: PropTypes.oneOf(FILTERS_LIST).isRequired,
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
