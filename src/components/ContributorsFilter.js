import React from 'react';
import { defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import StyledButton from './StyledButton';
import { Span } from './Text';
import roles from '../constants/roles';
import withIntl from '../lib/withIntl';

const FILTERS = {
  ALL: 'ALL',
  CORE: 'CORE',
  FINANCIAL: 'FINANCIAL',
  GITHUB: 'GITHUB',
};

const FILTERS_LIST = Object.values(FILTERS);

const Translations = defineMessages({
  [FILTERS.ALL]: {
    id: 'ContributorsFilter.All',
    defaultMessage: 'All contributors',
  },
  [FILTERS.CORE]: {
    id: 'ContributorsFilter.Core',
    defaultMessage: 'Core contributors',
  },
  [FILTERS.FINANCIAL]: {
    id: 'ContributorsFilter.Financial',
    defaultMessage: 'Financial contributors',
  },
  [FILTERS.GITHUB]: {
    id: 'ContributorsFilter.Github',
    defaultMessage: 'Github contributors',
  },
});

const buttonPropsSelected = {
  buttonStyle: 'dark',
};

const buttonPropsUnselected = {
  buttonStyle: 'standard',
  backgroundColor: '#F5F7FA',
  color: '#4E5052',
  border: '1px solid #F5F7FA',
};

/**
 * A helper to filter a members list by member type
 */
export const filterMembers = (members, memberType) => {
  if (!members) {
    return [];
  }

  if (memberType === FILTERS.CODE) {
    return members.filter(m => [roles.HOST, roles.ADMIN].includes(m.role));
  } else if (memberType === FILTERS.FINANCIAL) {
    return members.filter(m => [roles.BACKER, roles.FUNDRAISER].includes(m.role));
  } else {
    return members;
  }
};

/**
 * Filter contributors types
 */
const ContributorsFilter = ({ intl, selected, onChange }) => {
  return (
    <Flex>
      {FILTERS_LIST.map(filter => {
        const isSelected = filter === selected;
        return (
          <StyledButton
            key={filter}
            mx={2}
            onClick={() => (isSelected ? undefined : onChange(filter))}
            {...(isSelected ? buttonPropsSelected : buttonPropsUnselected)}
          >
            <Span textTransform="capitalize">{intl.formatMessage(Translations[filter])}</Span>
          </StyledButton>
        );
      })}
    </Flex>
  );
};

ContributorsFilter.propTypes = {
  selected: PropTypes.oneOf(FILTERS_LIST).isRequired,
  onChange: PropTypes.func.isRequired,
  intl: PropTypes.object,
};

export default withIntl(ContributorsFilter);
