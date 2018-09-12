import { Box, Flex } from 'grid-styled';
import SearchIcon from './SearchIcon';
import { fontSize } from 'styled-system';
import styled from 'styled-components';

const SearchInputContainer = Flex.extend`
  border: solid 1px var(--silver-four);
  border-radius: 20px;
`;

const SearchInput = styled(Box)`
  && {
    background-color: transparent;
    border: none;
    font-size: 1.2rem;
    letter-spacing: 0.1rem;
    ${fontSize}
  }
`;

const SearchButton = Flex.extend`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
  }
`;

const SearchForm = ({ fontSize }) => (
  <form action="/search" method="GET">
    <SearchInputContainer
      alignItems="center"
      justifyContent="space-between"
      p={1}
    >
      <SearchInput 
        is="input"
        type="search" 
        name="q" 
        placeholder="Search Open Collective" 
        py={1} 
        pl={3}
        width={1}
        fontSize={fontSize}
      />
      <SearchButton is="button" mr={1} p={1}>
        <SearchIcon size={16} fill="#aaaaaa" />
      </SearchButton>
    </SearchInputContainer>
  </form>
);

export default SearchForm;
