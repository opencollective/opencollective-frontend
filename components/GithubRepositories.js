import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Search } from '@styled-icons/octicons/Search';

import { escapeInput } from '../lib/utils';
import { H4 } from './Text';

import Container from './Container';
import StyledCard from './StyledCard';
import StyledRadioList from './StyledRadioList';
import StyledInput from './StyledInput';
import GithubRepositoryEntry from './GithubRepositoryEntry';
import { injectIntl, defineMessages } from 'react-intl';

const SearchIcon = styled(Search)`
  color: ${themeGet('colors.black.300')};
`;

const RepositoryEntryContainer = styled(Container)`
  cursor: pointer;
  &:hover {
    background: ${themeGet('colors.black.50')};
  }
`;

const messages = defineMessages({
  filterByName: { id: 'Filter.ByName', defaultMessage: 'Filter by name' },
});

/**
 * Component for displaying list of public repositories
 */
const GithubRepositories = ({ repositories, onCreateCollective, creatingCollective, intl, ...fieldProps }) => {
  const [search, setSearch] = useState('');
  if (search) {
    const test = new RegExp(escapeInput(search), 'i');
    repositories = repositories.filter(repository => repository.name.match(test));
  }

  const showSearch = true; // repositories.length >= 5;
  return (
    <StyledCard maxWidth={500} minWidth={464}>
      {showSearch && (
        <Container display="flex" borderBottom="1px solid" borderColor="black.200" px={4} py={1} alignItems="center">
          <SearchIcon size="16" />
          <StyledInput
            bare
            type="text"
            fontSize="Paragraph"
            lineHeight="Paragraph"
            placeholder={intl.formatMessage(messages.filterByName)}
            onChange={({ target }) => {
              setSearch(target.value);
            }}
            ml={2}
          />
        </Container>
      )}

      {repositories.length === 0 && (
        <Container my={3}>
          <H4 textAlign="center" fontSize="1.4rem" color="black.400">
            No repository match
          </H4>
        </Container>
      )}
      <StyledRadioList {...fieldProps} options={repositories} keyGetter="name">
        {({ value, radio, checked }) => {
          return (
            <RepositoryEntryContainer px={4} py={3}>
              <GithubRepositoryEntry
                radio={radio}
                value={value}
                checked={checked}
                onCreateCollective={onCreateCollective}
                creatingCollective={creatingCollective}
              />
            </RepositoryEntryContainer>
          );
        }}
      </StyledRadioList>
    </StyledCard>
  );
};

GithubRepositories.propTypes = {
  /** List of public repositories */
  repositories: PropTypes.array.isRequired,
  /** a boolean to know when a collective is being created */
  creatingCollective: PropTypes.bool,
  /** handles the submitted collective */
  onCreateCollective: PropTypes.func.isRequired,
  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default injectIntl(GithubRepositories);
