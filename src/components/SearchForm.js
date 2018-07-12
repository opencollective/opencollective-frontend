import { Box, Flex } from 'grid-styled';
import SearchIcon from './SearchIcon';

const SearchInputContainer = Flex.extend`
  border: solid 1px var(--silver-four);
  border-radius: 20px;
`;

const SearchInput = Box.extend`
  && {
    background-color: transparent;
    border: none;
    font-size: 1.2rem;
    letter-spacing: 0.1rem;
  }
`;

const SearchButton = Flex.extend`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
  }
`;

const SearchForm = () => (
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
        w={1}
      />
      <SearchButton is="button" mr={1} p={1}>
        <SearchIcon size={16} fill="#aaaaaa" />
      </SearchButton>
    </SearchInputContainer>
  </form>
);

export default SearchForm;
