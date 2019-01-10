import React from 'react';
import PropTypes from 'prop-types';
import { compose, withHandlers, withState } from 'recompose';
import { capitalize, omit, uniqBy } from 'lodash';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { FormattedMessage } from 'react-intl';
import { Box, Flex } from '@rebass/grid';

import { Search } from 'styled-icons/octicons/Search.cjs';

import { escapeInput } from '../lib/utils';

import Avatar from './Avatar';
import Container from './Container';
import Logo from './Logo';
import { P } from './Text';
import StyledCard from './StyledCard';
import StyledRadioList from './StyledRadioList';
import StyledInputField from './StyledInputField';
import StyledInputGroup from './StyledInputGroup';
import StyledInput from './StyledInput';

const SearchIcon = styled(Search)`
  color: ${themeGet('colors.black.300')};
`;

const ContributeAsEntryContainer = styled(Container)`
  cursor: pointer;
  &:hover {
    background: ${themeGet('colors.black.50')};
  }
`;

const enhance = compose(
  withState('state', 'setState', ({ errors = {} }) => ({ errors })),
  withHandlers({
    getFieldError: ({ state }) => name => state.errors[name],
    onChange: ({ onChange, state }) => selected => {
      if (selected.key === 'new-org') {
        if (state.orgName) {
          return onChange({ type: 'ORGANIZATION', ...omit(state, ['errors']) });
        } else {
          return onChange(null);
        }
      }

      if (selected.key === 'anonymous') {
        return onChange({ name: 'anonymous' });
      }

      return onChange(selected.value);
    },
    onFieldChange: ({ onChange, setState }) => event => {
      event.stopPropagation();

      const { target } = event;
      if (!target.validity.valid) {
        target.reportValidity();
        return;
      }

      setState(state => {
        const newState = {
          ...state,
          [target.name]: target.value,
        };
        onChange({ type: 'ORGANIZATION', ...omit(newState, ['errors']) });
        return {
          ...newState,
          errors: { ...state.errors, [target.name]: null },
        };
      });
    },
    onInvalid: ({ onChange, setState }) => event => {
      event.persist();
      event.preventDefault();

      const { target } = event;

      let error;
      if (target.validity.valueMissing) {
        error = 'This field is required';
      }

      if (target.validity.typeMismatch) {
        if (target.type === 'url') {
          error = 'URL must begin with http:// or https://';
        }
      }

      setState(state => {
        onChange(null);
        return {
          ...state,
          errors: { ...state.errors, [target.name]: error },
        };
      });
    },
    onSearch: ({ setState }) => ({ target }) => {
      setState(state => ({
        ...state,
        search: target.value,
      }));
    },
  }),
  // follows composition of onInvalid to access them from props
  withHandlers({
    getFieldProps: ({ state, onInvalid }) => name => ({
      defaultValue: state[name] || '',
      fontSize: 'Paragraph',
      lineHeight: 'Paragraph',
      onInvalid,
      type: 'text',
      width: 1,
    }),
  }),
);

/**
 * Search is displayed if 5 or more profiles are passed in.
 */
const ContributeAs = enhance(
  ({
    getFieldProps,
    getFieldError,
    onChange,
    onFieldChange,
    onSearch,
    personal,
    profiles,
    state,
    defaultSelectedProfile,
    ...fieldProps
  }) => {
    if (state.search) {
      const test = new RegExp(escapeInput(state.search), 'i');
      profiles = profiles.filter(profile => profile.name.match(test));
    }

    const options = uniqBy(
      [
        personal,
        ...profiles,
        { id: 'new-org', name: 'A new organization' },
        // { id: 'anonymous', name: 'Anonymously' }
      ],
      'id',
    );
    const lastIndex = Object.keys(options).length - 1;
    const showSearch = Object.keys(profiles).length >= 5 || state.search;

    return (
      <StyledCard maxWidth={500}>
        {showSearch && (
          <Container display="flex" borderBottom="1px solid" borderColor="black.200" px={4} py={1} alignItems="center">
            <SearchIcon size="16" />
            <StyledInput
              bare
              type="text"
              fontSize="Paragraph"
              lineHeight="Paragraph"
              placeholder="Filter by name..."
              onChange={onSearch}
            />
          </Container>
        )}
        <StyledRadioList
          {...fieldProps}
          options={options}
          keyGetter="id"
          defaultValue={defaultSelectedProfile.id}
          onChange={onChange}
        >
          {({ key, value, radio, checked, index }) => (
            <ContributeAsEntryContainer
              display="flex"
              alignItems="center"
              px={4}
              py={3}
              borderBottom={lastIndex !== index ? '1px solid' : 'none'}
              color={key === 'anonymous' && checked ? 'white.full' : 'black.900'}
              bg={key === 'anonymous' && checked ? 'black.900' : 'white.full'}
              borderColor="black.200"
              flexWrap="wrap"
            >
              <Box as="span" mr={3}>
                {radio}
              </Box>
              {value.type === 'USER' ? (
                <Avatar src={value.image} type={value.type} size="3.6rem" name={value.name} />
              ) : (
                <Logo src={value.image} type={value.type} height="3.6rem" name={value.name} />
              )}
              <Flex flexDirection="column" ml={2}>
                <P color="inherit" fontWeight={value.type ? 600 : 500}>
                  {value.name}
                </P>
                {value.type && (
                  <P fontSize="Caption" lineHeight="Caption" color="black.500">
                    {value.type === 'USER' ? (
                      <FormattedMessage
                        id="contributeAs.personal"
                        defaultMessage="Personal account - {email}"
                        values={{ email: value.email }}
                      />
                    ) : (
                      capitalize(value.type)
                    )}
                  </P>
                )}
              </Flex>
              {key === 'new-org' && checked && (
                <Container as="fieldset" border="none" width={1} py={3} onChange={onFieldChange}>
                  <Box mb={3}>
                    <StyledInputField label="Organization Name" htmlFor="orgName" error={getFieldError('orgName')}>
                      {inputProps => (
                        <StyledInput
                          {...inputProps}
                          {...getFieldProps(inputProps.name)}
                          placeholder="i.e. AirBnb, Women Who Code"
                          required
                        />
                      )}
                    </StyledInputField>
                  </Box>

                  <Box mb={3}>
                    <StyledInputField label="Website" htmlFor="website" error={getFieldError('website')}>
                      {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} type="url" />}
                    </StyledInputField>
                  </Box>

                  <Box mb={3}>
                    <StyledInputField
                      label="GitHub (optional)"
                      htmlFor="githubHandle"
                      error={getFieldError('githubHandle')}
                    >
                      {inputProps => (
                        <StyledInputGroup {...inputProps} {...getFieldProps(inputProps.name)} prepend="github.com/" />
                      )}
                    </StyledInputField>
                  </Box>

                  <Box>
                    <StyledInputField
                      label="Twitter (optional)"
                      htmlFor="twitterHandle"
                      error={getFieldError('twitterHandle')}
                    >
                      {inputProps => (
                        <StyledInputGroup {...inputProps} {...getFieldProps(inputProps.name)} prepend="@" />
                      )}
                    </StyledInputField>
                  </Box>
                </Container>
              )}
              {key === 'anonymous' && checked && (
                <Flex flex="1 1 auto" justifyContent="flex-end">
                  <Logo name={key} height="3rem" />
                </Flex>
              )}
            </ContributeAsEntryContainer>
          )}
        </StyledRadioList>
      </StyledCard>
    );
  },
);

ContributeAs.displayName = 'ContributeAs';

ContributeAs.propTypes = {
  /**
   * emits latest selected profile <br />
   * if anoymous is selected, only `{name: 'anonymous'}` is returned <br />
   * if 'A new organization' is selected, the latest data from that form is returned <br />
   * else the data passed to `profiles` or `personal` is returned
   */
  onChange: PropTypes.func,
  defaultSelectedProfile: PropTypes.shape({
    id: PropTypes.number,
  }),
  personal: PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    image: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
  }),
  profiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      email: PropTypes.string,
      image: PropTypes.string,
      name: PropTypes.string,
      type: PropTypes.string,
    }),
  ),
};

ContributeAs.defaultProps = {
  onChange: () => {}, // noop
};

export default ContributeAs;
