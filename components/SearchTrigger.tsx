import React from 'react';
import { Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Flex } from './Grid';
import Hide from './Hide';
import StyledButton from './StyledButton';

const SearchButton = styled(StyledButton)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #6b7280;
  font-weight: 400;
  height: 40px;
  padding: 0 10px;
  max-width: 200px;
  flex: 1;

  .shortcut {
    font-size: 12px;
    border: 1px solid #d1d5db;
    background-color: #f1f5f9;
    border-radius: 100px;
    padding: 2px 6px;
    letter-spacing: 0;
  }

  &:active {
    .shortcut {
      background-color: inherit;
    }
  }
`;

const KeyShortcutSymbol = () => {
  const [keySymbol, setKeySymbol] = React.useState(null);

  React.useEffect(() => {
    const platform = window.navigator.platform;
    if (platform.includes('Mac')) {
      setKeySymbol('⌘');
    } else if (platform.includes('Win') || platform.includes('Linux')) {
      setKeySymbol('Ctrl');
    }
  }, []);

  if (!keySymbol) {
    return null;
  }

  return (
    <Hide xs sm>
      <span className="shortcut">{keySymbol}+K</span>
    </Hide>
  );
};

const SearchTrigger = ({ setShowSearchModal }) => {
  React.useEffect(() => {
    const handleKeydown = e => {
      if (e.key === 'k' && e.metaKey) {
        setShowSearchModal(show => !show);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <SearchButton onClick={() => setShowSearchModal(true)}>
      <Flex alignItems="center" gridGap="6px">
        <Search size={14} /> <FormattedMessage id="search.placeholder" defaultMessage="Search..." />
      </Flex>
      <KeyShortcutSymbol />
    </SearchButton>
  );
};

export default SearchTrigger;
