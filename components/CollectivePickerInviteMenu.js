import React from 'react';
import { PlusCircle } from '@styled-icons/feather/PlusCircle';
import { FormattedMessage } from 'react-intl';

import { ExpenseType } from '@/lib/graphql/types/v2/graphql';

import { Box, Flex } from './Grid';
import Image from './Image';
import StyledButton from './StyledButton';
import { Span } from './Text';

export const InviteCollectiveDropdownOption = ({ onClick, isSearching, expenseType }) => (
  <Flex flexDirection="column">
    {isSearching && (
      <Flex mb="16px">
        <Image alt="" width={48} height={48} src="/static/images/magnifier.png" />
        <Box ml="16px">
          <Span fontSize="12px" fontWeight="700" color="black.800">
            <FormattedMessage
              id="CollectivePicker.InviteMenu.Description"
              defaultMessage="Not found. You can invite or create a new profile."
            />
          </Span>
        </Box>
      </Flex>
    )}
    <StyledButton borderRadius="14px" onClick={onClick} data-cy="collective-picker-invite-button">
      <Flex alignItems="center">
        <PlusCircle size={24} />
        <Box ml="16px" fontSize="11px">
          {expenseType === ExpenseType.GRANT ? (
            <FormattedMessage defaultMessage="Invite someone to submit a grant request" id="OJwe9I" />
          ) : (
            <FormattedMessage
              id="CollectivePicker.InviteMenu.ButtonLabel"
              defaultMessage="Invite someone to submit an expense"
            />
          )}
        </Box>
      </Flex>
    </StyledButton>
  </Flex>
);
