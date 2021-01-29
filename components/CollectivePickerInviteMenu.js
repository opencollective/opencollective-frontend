import React from 'react';
import PropTypes from 'prop-types';
import { PlusCircle } from '@styled-icons/feather/PlusCircle';
import { FormattedMessage } from 'react-intl';

import { isValidEmail } from '../lib/utils';

import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import { Span } from './Text';

export const InviteCollectiveDropdownOption = ({ onClick, isSearching }) => (
  <Flex flexDirection="column">
    {isSearching && (
      <Flex mb="16px">
        <img width="48px" height="48px" src="/static/images/magnifier.png" />
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

export const InviteCollectiveForm = ({ onCancel, onSave }) => {
  const [value, setValue] = React.useState({ name: '', email: '', isInvite: true });
  const setValueProp = prop => e => {
    e.persist();
    setValue(v => ({ ...v, [prop]: e.target?.value }));
  };

  return (
    <Flex flexDirection="column">
      <form
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          onSave(value);
        }}
        data-cy="collective-picker-invite-form"
      >
        <StyledInputField
          name="name"
          label="Name"
          labelFontSize="13px"
          labelColor="black.700"
          labelProps={{ fontWeight: 600 }}
        >
          {props => (
            <StyledInput
              {...props}
              type="text"
              placeholder="i.e. Jane Doe"
              value={value.name}
              onChange={setValueProp('name')}
              mb="20px"
            />
          )}
        </StyledInputField>
        <StyledInputField
          name="email"
          label="Email"
          labelFontSize="13px"
          labelColor="black.700"
          labelProps={{ fontWeight: 600 }}
        >
          {props => (
            <StyledInput
              {...props}
              type="email"
              placeholder="i.e. jane@opencollective.com"
              value={value.email}
              onChange={setValueProp('email')}
              mb="18px"
            />
          )}
        </StyledInputField>
        <Box>
          <StyledButton
            disabled={!isValidEmail(value.email)}
            buttonStyle="primary"
            buttonSize="small"
            mr={2}
            type="submit"
          >
            <FormattedMessage id="save" defaultMessage="Save" />
          </StyledButton>
          <StyledButton buttonSize="small" onClick={() => onCancel()}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Box>
      </form>
    </Flex>
  );
};

InviteCollectiveForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
