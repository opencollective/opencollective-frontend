import React from 'react';
import { Search } from '@styled-icons/boxicons-regular/Search';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import { P } from '../Text';

const SearchInput = styled(StyledInput)`
  background-color: #f9fafb;
  border: none;
`;

const SearchTopics = () => {
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
            backgroundColor="#F9FAFB"
          />
          <StyledButton backgroundColor="black.50" padding="5px" border="none">
            <Search size="20px" color="#75777A" />
          </StyledButton>
        </StyledCard>
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
