import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import styled from 'styled-components';
import { borderRadius, fontSize } from 'styled-system';

import { Box, Flex } from './Grid';
import SearchIcon from './SearchIcon';
import StyledInput from './StyledInput';

const SearchInputContainer = styled(Flex)`
  border: solid 1px var(--silver-four);
  ${borderRadius};
  background-color: white;
`;

const SearchInput = styled(Box)`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
    font-size: 1.2rem;
    letter-spacing: 0.1rem;
    font-style: italic;
    ${fontSize};
    ::placeholder {
      color: #9d9fa3;
    }
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
  this.props.router.push({ pathname: '/search', query: { q: searchInput.value } });
  event.preventDefault();
};

const SearchForm = ({
  fontSize,
  onSubmit = handleSubmit,
  placeholder = 'Search...',
  width = 1,
  defaultValue,
  value,
  onChange,
  borderRadius = '20px',
}) => (
  <form action="/search" method="GET" onSubmit={onSubmit}>
    <SearchInputContainer borderRadius={borderRadius} alignItems="center" justifyContent="space-between" p={1}>
      <SearchButton as="button" ml={1} p={1}>
        <SearchIcon size={16} fill="#aaaaaa" />
      </SearchButton>
      <SearchInput
        as={StyledInput}
        type="search"
        name="q"
        placeholder={placeholder}
        py={1}
        pl={3}
        width={width}
        fontSize={fontSize}
        aria-label="Open collective search input"
        defaultValue={defaultValue}
        value={value}
        onChange={onChange && (e => onChange(e.target.value))}
      />
    </SearchInputContainer>
  </form>
);

SearchForm.propTypes = {
  fontSize: PropTypes.string,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  backgroundColor: PropTypes.string,
  width: PropTypes.number,
  onChange: PropTypes.func,
  borderRadius: PropTypes.string,
};

export default withRouter(SearchForm);
