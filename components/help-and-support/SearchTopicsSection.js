import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { debounce, isEmpty, truncate } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { searchDocs } from '../../lib/api';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import { getI18nLink, I18nBold, I18nUnderline } from '../I18nFormatters';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import SearchForm from '../SearchForm';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const SearchResultPopup = styled(StyledCard)`
  border: 1px solid rgba(50, 51, 52, 0.05);
  box-shadow:
    0px 18px 40px rgba(0, 0, 0, 0.0059351),
    0px 7.56604px 12.0812px rgba(0, 0, 0, 0.0111057),
    0px 4.10431px 6.12521px rgba(0, 0, 0, 0.0160729),
    0px 2.27585px 3.41503px rgba(0, 0, 0, 0.0209117),
    0px 1.1708px 1.84491px rgba(0, 0, 0, 0.0256307),
    0px 0.463169px 0.792047px rgba(0, 0, 0, 0.03);
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

const LoadingSearchResults = () => {
  const placeholderNum = 4;
  return Array.from({ length: placeholderNum }, (_, i) => (
    <React.Fragment key={i}>
      <LoadingPlaceholder height="62px" borderRadius="4px" />
      {i !== placeholderNum - 1 && <StyledHr my="3px" width="100%" borderColor="rgba(50, 51, 52, 0.1)" />}
    </React.Fragment>
  ));
};

const SearchTopics = () => {
  const intl = useIntl();
  const innerRef = React.useRef();
  const [refElement, setRefElement] = React.useState(null);
  const [popperElement, setPopperElement] = React.useState(null);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const { styles, attributes } = usePopper(refElement, popperElement, {
    placement: 'bottom',
    modifiers: REACT_POPPER_MODIFIERS,
  });

  useGlobalBlur(innerRef, outside => {
    if (outside && showSearchResults) {
      setShowSearchResults(false);
    }
  });
  const sections = React.useMemo(() => getAllSections(searchResults), [searchResults]);

  const search = async query => {
    if (!query) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    try {
      const results = await searchDocs(query);
      setSearchResults(results.items);
    } catch (error) {
      toast({
        variant: 'error',
        title: intl.formatMessage({ defaultMessage: 'Error in fetching results' }),
        message: (
          <p>
            <FormattedMessage
              defaultMessage={
                'Oops! There was an unexpected error.{lineBreak} <openDocsLink><u>Visit our docs page</u></openDocsLink>'
              }
              values={{
                openDocsLink: getI18nLink({
                  href: `${DOCS_BASE_URL}`,
                  openInNewTab: true,
                }),
                u: I18nUnderline,
                lineBreak: <br />,
              }}
            />
          </p>
        ),
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = React.useCallback(debounce(search, 500), []);

  return (
    <Flex justifyContent="center" alignItems="center" px="16px">
      <Flex mt={['9px', '32px']} flexDirection="column" ref={innerRef}>
        <Box ref={setRefElement} maxWidth={'714px'} data-cy="search-input">
          <SearchForm
            width={['1', '500px', '608px']}
            borderRadius="100px"
            placeholder={intl.formatMessage({ defaultMessage: 'Type keywords to search for topics' })}
            showSearchButton
            searchButtonStyles={{ width: '32px', height: '32px' }}
            value={searchQuery}
            onSubmit={e => e.preventDefault()}
            onChange={query => {
              if (!showSearchResults) {
                setShowSearchResults(true);
              }

              setSearchQuery(query);
              setIsLoading(true);
              debouncedSearch(query);
            }}
            onClearFilter={() => setSearchQuery('')}
            onFocus={() => setShowSearchResults(true)}
            autoComplete="off"
            fontStyle="normal"
            fontSize="16px"
            lineHeight="20px"
            letterSpacing="normal"
            fontWeight="400"
          />
        </Box>
        {showSearchResults && (
          <SearchResultPopup
            width={['302px', '650px', '700px']}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <Box maxHeight="416px" overflowY={'auto'} data-cy="search-result-popup">
              {isLoading ? (
                <LoadingSearchResults data-cy="search-loading-placeholder" />
              ) : isEmpty(sections) ? (
                <Container
                  display="flex"
                  justifyContent={'center'}
                  align="center"
                  py={'16px'}
                  backgroundColor={searchQuery && 'red.100'}
                >
                  <P fontSize="18px" lineHeight="26px" color="#4D4F51" fontWeight="400">
                    {searchQuery ? (
                      <FormattedMessage
                        defaultMessage={'No results found for <b>{query}</b>. Please type another keyword.'}
                        values={{
                          query: searchQuery,
                          b: I18nBold,
                        }}
                      />
                    ) : (
                      <FormattedMessage defaultMessage={'Type something to search'} />
                    )}
                  </P>
                </Container>
              ) : (
                <React.Fragment>
                  {sections.map((section, index) => {
                    return (
                      <React.Fragment key={section.id}>
                        <Link data-cy="search-result-link" href={`${DOCS_BASE_URL}/${section.path}`} openInNewTab>
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
