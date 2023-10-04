import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { Search } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { escapeInput } from '../../lib/utils';

import Container from '../Container';
import { Box } from '../Grid';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledRadioList from '../StyledRadioList';
import { H4 } from '../Text';

import GithubRepositoryEntry from './GithubRepositoryEntry';

const SearchIcon = styled(Search)`
  color: ${themeGet('colors.black.300')};
`;

const RepositoryEntryContainer = styled(Container)`
  cursor: pointer;
  border-bottom: 1px solid ${themeGet('colors.black.200')};
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
const GithubRepositories = ({ repositories, setGithubInfo, ...fieldProps }) => {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState();

  if (search) {
    const test = new RegExp(escapeInput(search), 'i');
    repositories = repositories.filter(repository => repository.name.match(test));
  }

  const showSearch = true; // repositories.length >= 5;

  return (
    <Fragment>
      <StyledCard>
        {showSearch && (
          <Container
            display="flex"
            borderBottom="1px solid"
            borderColor="black.200"
            px={[2, 4]}
            py={1}
            alignItems="center"
          >
            <SearchIcon size="16" />
            <StyledInput
              bare
              type="text"
              fontSize="14px"
              lineHeight="20px"
              placeholder={formatMessage(messages.filterByName)}
              onChange={({ target }) => {
                setSearch(target.value);
              }}
              ml={2}
            />
          </Container>
        )}

        {repositories.length === 0 && (
          <Container my={3}>
            <H4 textAlign="center" fontSize="0.85rem" color="black.400">
              No repository match
            </H4>
          </Container>
        )}
        <Box maxHeight="420px" overflow="auto">
          <StyledRadioList
            {...fieldProps}
            options={repositories}
            onChange={({ value }) => {
              setGithubInfo({
                handle: `${value.owner.login}/${value.name}`,
                licenseSpdxId: value.license?.spdx_id,
              });
            }}
            keyGetter="name"
          >
            {({ value, radio }) => {
              return (
                <RepositoryEntryContainer px={[2, 4]} py={3}>
                  <GithubRepositoryEntry radio={radio} value={value} />
                </RepositoryEntryContainer>
              );
            }}
          </StyledRadioList>
        </Box>
      </StyledCard>
    </Fragment>
  );
};

GithubRepositories.propTypes = {
  /** List of public repositories */
  repositories: PropTypes.array.isRequired,
  setGithubInfo: PropTypes.func.isRequired,
};

export default GithubRepositories;
