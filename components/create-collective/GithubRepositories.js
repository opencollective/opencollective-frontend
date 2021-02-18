import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Search } from '@styled-icons/octicons/Search';
import themeGet from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { escapeInput } from '../../lib/utils';

import Container from '../Container';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
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
const GithubRepositories = ({ repositories, submitGithubInfo, ...fieldProps }) => {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState();
  const [disabled, setDisabled] = useState(true);
  const [githubInfo, setGithubInfo] = useState();

  if (search) {
    const test = new RegExp(escapeInput(search), 'i');
    repositories = repositories.filter(repository => repository.name.match(test));
  }

  const showSearch = true; // repositories.length >= 5;

  return (
    <Fragment>
      <StyledCard maxWidth={[300, 448, 500]}>
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
            <H4 textAlign="center" fontSize="1.4rem" color="black.400">
              No repository match
            </H4>
          </Container>
        )}

        <StyledRadioList
          {...fieldProps}
          options={repositories}
          onChange={({ value }) => {
            if (value.owner.type === 'User') {
              setDisabled(false);
              setGithubInfo({
                handle: `${value.owner.login}/${value.name}`,
                repo: value.name,
              });
            }
          }}
          keyGetter="name"
        >
          {({ value, radio, checked }) => {
            return (
              <RepositoryEntryContainer px={[2, 4]} py={3}>
                <GithubRepositoryEntry
                  radio={radio}
                  value={value}
                  checked={checked}
                  changeRepoInfo={(type, value) => {
                    if (type === 'repository') {
                      setDisabled(false);
                      setGithubInfo({
                        handle: `${value.owner.login}/${value.name}`,
                        repo: value.name,
                      });
                    } else {
                      setDisabled(false);
                      setGithubInfo({
                        handle: value.owner.login,
                        repo: value.name,
                      });
                    }
                  }}
                />
              </RepositoryEntryContainer>
            );
          }}
        </StyledRadioList>
      </StyledCard>
      <Flex justifyContent="center">
        <StyledButton
          textAlign="center"
          buttonSize="small"
          minHeight="36px"
          maxWidth="97px"
          buttonStyle="primary"
          disabled={disabled}
          onClick={() => submitGithubInfo(githubInfo)}
          m={2}
          mt={4}
          px={[2, 3]}
          data-cy="connect-github-continue"
        >
          <FormattedMessage id="actions.continue" defaultMessage="Continue" />
        </StyledButton>
      </Flex>
    </Fragment>
  );
};

GithubRepositories.propTypes = {
  /** List of public repositories */
  repositories: PropTypes.array.isRequired,
  submitGithubInfo: PropTypes.func.isRequired,
};

export default GithubRepositories;
