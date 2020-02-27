import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Flex } from '@rebass/grid';
import { Search } from '@styled-icons/octicons/Search';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import { H4 } from '../../Text';
import Container from '../../Container';
import StyledCard from '../../StyledCard';
import StyledRadioList from '../../StyledRadioList';
import StyledInput from '../../StyledInput';
import StyledButton from '../../StyledButton';
import GithubRepositoryEntry from './GithubRepositoryEntry';

import { escapeInput } from '../../../lib/utils';

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
const GithubRepositories = ({ repositories, sendRepoInfo, intl, ...fieldProps }) => {
  const [state, setState] = useState({ search: '', disabled: true, repoInfo: { type: 'repository' } });

  if (state.search) {
    const test = new RegExp(escapeInput(state.search), 'i');
    repositories = repositories.filter(repository => repository.name.match(test));
  }

  const showSearch = true; // repositories.length >= 5;
  return (
    <Fragment>
      <StyledCard maxWidth={[300, 500]} minWidth={[200, 464]}>
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
              fontSize="Paragraph"
              lineHeight="Paragraph"
              placeholder={intl.formatMessage(messages.filterByName)}
              onChange={({ target }) => {
                setState(state => ({
                  ...state,
                  search: target.value,
                }));
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
              <RepositoryEntryContainer px={[2, 4]} py={3}>
                <GithubRepositoryEntry
                  radio={radio}
                  value={value}
                  checked={checked}
                  changeRepoInfo={(type, value) => {
                    if (type === 'repository') {
                      setState(state => ({
                        ...state,
                        disabled: false,
                        repoInfo: {
                          type,
                          handle: `${value.owner.login}/${value.name}`,
                        },
                      }));
                    } else {
                      setState(state => ({
                        ...state,
                        disabled: false,
                        repoInfo: {
                          type,
                          handle: `${value.owner.login}`,
                        },
                      }));
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
          height="36px"
          maxWidth="97px"
          buttonStyle="primary"
          disabled={state.disabled}
          onClick={() => sendRepoInfo(state.repoInfo)}
          m={2}
          px={[2, 3]}
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
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  sendRepoInfo: PropTypes.func,
};

export default injectIntl(GithubRepositories);
