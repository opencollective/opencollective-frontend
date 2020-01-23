import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { fontSize } from 'styled-system';
import styled from 'styled-components';

import { Router } from '../server/pages';

import SearchIcon from './SearchIcon';

const SearchInputContainer = styled(Flex)`
  border: 1px solid #dcdee0;
  border-radius: 8px;
  background-color: #fff;
`;

const SearchInput = styled(Box)`
  && {
    color: rgba(255, 255, 255, 0.4);
    appearance: none;
    background-color: transparent;
    border: none;
    font-size: 14px;
    line-height: 24px;
    letter-spacing: -0.2px;
    ${fontSize};
  }
`;

const SearchButton = styled(Flex)`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
  }
`;

const handleSubmit = event => {
  const searchInput = event.target.elements.q;
  Router.pushRoute('search', { q: searchInput.value });
  event.preventDefault();
};

const SearchForm = ({ fontSize, onSubmit = handleSubmit, placeholder = 'Search Open Collective...', width = 1 }) => (
  <form action="/search" method="GET" onSubmit={onSubmit}>
    <SearchInputContainer alignItems="center" justifyContent="space-between" p={1}>
      <SearchInput
        as="input"
        type="search"
        name="q"
        placeholder={placeholder}
        py={1}
        pl={3}
        width={width}
        fontSize={fontSize}
        aria-label="Open collective search input"
      />
      <SearchButton as="button" mr={1} p={1}>
        <SearchIcon size={16} fill="#aaaaaa" />
      </SearchButton>
    </SearchInputContainer>
  </form>
);

SearchForm.propTypes = {
  fontSize: PropTypes.string,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  backgroundColor: PropTypes.string,
  width: PropTypes.number,
};

export default SearchForm;
