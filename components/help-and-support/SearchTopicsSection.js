import React from 'react';
import { Search } from '@styled-icons/boxicons-regular/Search';
import { themeGet } from '@styled-system/theme-get';
import { debounce, isEmpty, truncate } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { searchDocs } from '../../lib/api';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import { P } from '../Text';

const SearchInput = styled(StyledInput)`
  background-color: #f9fafb;
  border: none;
`;

const SearchResultPopup = styled(StyledCard)`
  border: 1px solid rgba(50, 51, 52, 0.05);
  box-shadow: 0px 18px 40px rgba(0, 0, 0, 0.0059351), 0px 7.56604px 12.0812px rgba(0, 0, 0, 0.0111057),
    0px 4.10431px 6.12521px rgba(0, 0, 0, 0.0160729), 0px 2.27585px 3.41503px rgba(0, 0, 0, 0.0209117),
    0px 1.1708px 1.84491px rgba(0, 0, 0, 0.0256307), 0px 0.463169px 0.792047px rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  padding: 20px;
  z-index: 1;
`;

const SectionCard = styled(StyledCard)`
  border: none;

  &:hover {
    background: ${themeGet('colors.blue.600')};

    p {
      color: white;
    }
  }
`;

function getAllSections(items) {
  return items.reduce((acc, item) => {
    return [...acc, ...item.sections];
  }, []);
}

const DOCS_BASE_URL = 'https://docs.opencollective.com';

const REACT_POPPER_MODIFIERS = [
  {
    name: 'offset',
    options: {
      offset: [0, 10],
    },
  },
];

const SearchTopics = () => {
  const [refElement, setRefElement] = React.useState(null);
  const [popperElement, setPopperElement] = React.useState(null);
  const [showSearchResults, setShowSearchResults] = React.useState(null);
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { styles, attributes, state } = usePopper(refElement, popperElement, {
    placement: 'bottom',
    modifiers: REACT_POPPER_MODIFIERS,
  });

  useGlobalBlur(state?.elements.popper, outside => {
    if (outside && showSearchResults) {
      setShowSearchResults(false);
    }
  });
  const sections = React.useMemo(() => getAllSections(searchResults), [searchResults]);

  const search = async query => {
    if (!query) {
      return;
    }

    try {
      const results = await searchDocs(query);
      setSearchResults(results.items);
    } catch (error) {
      console.error('error', error);
    }
  };

  const debouncedSearch = React.useCallback(debounce(search, 100), []);

  return (
    <Flex justifyContent="center" alignItems="center" px="16px">
      <Flex mt={['9px', '32px']} flexDirection="column">
        <StyledCard
          bg="black.50"
          display="flex"
          width={['288px', '720px']}
          px="16px"
          py="24px"
          alignItems="center"
          justifyContent="space-between"
          borderRadius="12px"
          boxShadow="0px 1px 4px 1px rgba(49, 50, 51, 0.1)"
          borderWidth="0"
          ref={setRefElement}
        >
          <SearchInput
            fontSize="18px"
            color="black.900"
            lineHeight="26px"
            width="80%"
            placeholder="Search for topics"
            borderWidth="0"
            borderColor="transparent"
            px="0"
            py="0"
            value={searchQuery}
            backgroundColor="#F9FAFB"
            onChange={async e => {
              if (!showSearchResults) {
                setShowSearchResults(true);
              }

              const query = e.target.value;
              setSearchQuery(query);
              debouncedSearch(query);
            }}
            onFocus={() => setShowSearchResults(true)}
          />
          <Search size="20px" color="#75777A" />
        </StyledCard>
        {showSearchResults && (
          <SearchResultPopup width={['725px']} ref={setPopperElement} style={styles.popper} {...attributes.popper}>
            <Box maxHeight="416px" overflowY={'auto'}>
              {isEmpty(sections) ? (
                <Flex justifyContent={'center'} align="center" py={'20px'}>
                  <P fontSize="14px" lineHeight="20px" color="black.500" fontWeight="400">
                    <FormattedMessage defaultMessage={'No results found'} />
                  </P>
                </Flex>
              ) : (
                <React.Fragment>
                  {sections.map((section, index) => {
                    return (
                      <React.Fragment key={section.id}>
                        <Link href={`${DOCS_BASE_URL}/${section.path}`} openInNewTab>
                          <SectionCard px="12px" py="16px" border="none">
                            <P fontSize={'18px'} lineHeight="26px" fontWeight={'400'} color="#4D4F51">
                              {section.title}
                            </P>
                            <P fontSize={'14px'} lineHeight="20px" fontWeight={'400'} color="#4D4F51">
                              {truncate(section.body, { length: 100 })}
                            </P>
                          </SectionCard>
                        </Link>
                        {index !== sections.length - 1 && (
                          <StyledHr my="3px" width="100%" borderColor="rgba(50, 51, 52, 0.1)" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              )}
            </Box>
          </SearchResultPopup>
        )}
        <Box width={['288px', 1]} mt="16px">
          <P
            fontSize={['16px', '20px']}
            lineHeight={['24px', '28px']}
            fontWeight="500"
            textAlign="center"
            color="black.700"
            letterSpacing={[null, '-0.008em']}
          >
            <FormattedMessage
              id="helpAndSupport.searchDescription"
              defaultMessage={'You can also browse the topics below to find what you’re looking for.'}
            />
          </P>
        </Box>
      </Flex>
    </Flex>
  );
};

export default SearchTopics;
