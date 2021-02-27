import React from 'react';
import PropTypes from 'prop-types';
import { PlusCircle } from '@styled-icons/feather/PlusCircle';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import { Span } from './Text';

export const InviteCollectiveDropdownOption = ({ onClick, isSearching }) => (
  <Flex flexDirection="column">
    {isSearching && (
      <Flex mb="16px">
        <img alt="Magnifier" width="48px" height="48px" src="/static/images/magnifier.png" />
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
          <FormattedMessage
            id="CollectivePicker.InviteMenu.ButtonLabel"
            defaultMessage="Invite someone to submit an expense"
          />
        </Box>
      </Flex>
    </StyledButton>
  </Flex>
);

InviteCollectiveDropdownOption.propTypes = {
  onClick: PropTypes.func.isRequired,
  isSearching: PropTypes.bool,
};
