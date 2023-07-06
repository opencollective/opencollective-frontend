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
  height: 36px;
  padding: 0 12px;
  max-width: 280px;
  width: 280px;
  min-width: 120px;
  flex-shrink: 4;
  border-color: #e6e8eb;
  @media screen and (max-width: 52em) {
    width: 36px;
    min-width: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0;
  }

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
        <Search size={16} />
        <Hide xs sm>
          <span>
            <FormattedMessage
              defaultMessage="Type {slash} to search"
              values={{ slash: <span className="slash">/</span> }}
            />
          </span>
        </Hide>
      </Flex>
    </SearchButton>
  );
};

export default SearchTrigger;
