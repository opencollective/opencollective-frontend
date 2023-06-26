import React from 'react';
import { Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Flex } from './Grid';
import Hide from './Hide';
import StyledButton from './StyledButton';

const SearchButton = styled(StyledButton)`
  color: #6b7280;
  font-weight: 400;
  height: 40px;
  padding: 0 10px;
  max-width: 200px;
  flex: 1;

  .slash {
    border: 1px solid #d1d5db;
    background-color: #f1f5f9;
    border-radius: 4px;
    padding: 0 4px;
    letter-spacing: 0;
  }

  &:active,
  :hover {
    .slash {
      background-color: inherit;
    }
  }
`;

const SearchTrigger = ({ setShowSearchModal }) => {
  React.useEffect(() => {
    const handleKeydown = e => {
      if (e.key === '/' && e.target.tagName === 'BODY') {
        e.preventDefault();
        setShowSearchModal(show => !show);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <SearchButton onClick={() => setShowSearchModal(true)}>
      <Flex alignItems="center" gridGap="6px">
        <Search size={14} />
        <Hide xs sm>
          <FormattedMessage
            defaultMessage="Type {slash} to search"
            values={{ slash: <span className="slash">/</span> }}
          />
        </Hide>
        <Hide md lg>
          <FormattedMessage id="search.placeholder" defaultMessage="Search..." />
        </Hide>
      </Flex>
    </SearchButton>
  );
};

export default SearchTrigger;
