import React from 'react';
import PropTypes from 'prop-types';
import { compose, withHandlers, withState } from 'recompose';
import { capitalize, omit } from 'lodash';
import styled from 'styled-components';
import { themeGet } from 'styled-system';

import Avatar from './Avatar';
import { Box, Flex } from '@rebass/grid';
import Container from './Container';
import Logo from './Logo';
import { P } from './Text';
import StyledCard from './StyledCard';
import StyledRadioList from './StyledRadioList';
import StyledInputField from './StyledInputField';
import StyledInputGroup from './StyledInputGroup';
import StyledInput from './StyledInput';
import { Search } from 'styled-icons/octicons/Search.cjs';

const SearchIcon = styled(Search)`
  color: ${themeGet('colors.black.300')};
`;

const ContributeAsEntryContainer = styled(Container)`
  cursor: pointer;
  background: ${themeGet('colors.white.full')};
  &:hover {
    background: ${themeGet('colors.black.50')};
  }
`;

const enhance = compose(
  withState('state', 'setState', ({ errors = {} }) => ({ errors })),
  withHandlers({
    getFieldError: ({ state }) => name => state.errors[name],
    onChange: ({ onChange, personal, profiles, state }) => value => {
      if (value === 'new-org') {
        return onChange({ type: 'ORGANIZATION', ...omit(state, ['errors']) });
      }

      if (value === 'anonymous') {
        return onChange({ name: 'anonymous' });
      }

      if (value === '0') {
        return onChange(personal);
      }

      return onChange(profiles[value]);
    },
    onFieldChange: ({ onChange, setState }) => event => {
      event.stopPropagation();

      const { target } = event;
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
    onInvalid: ({ setState }) => event => {
      event.persist();
      event.preventDefault();
      setState(state => ({
        ...state,
        errors: { ...state.errors, [event.target.name]: event.target.validationMessage },
      }));
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
  ({ getFieldProps, getFieldError, onChange, onFieldChange, onSearch, personal, profiles, state, ...fieldProps }) => {
    profiles = {
      '0': personal, // personal should always be first
      ...profiles,
    };

    if (state.search) {
      const test = new RegExp(state.search, 'i');
      profiles = Object.keys(profiles)
        .filter(key => profiles[key].name.match(test))
        .reduce((result, key) => ({ ...result, [key]: profiles[key] }), {});
    }

    const options = {
      ...profiles,
      'new-org': {
        name: 'A new organization',
      },
      anonymous: {
        name: 'Anonymously',
      },
    };
    const firstProfile = Object.keys(options)[0];
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
        <StyledRadioList {...fieldProps} options={options} onChange={onChange} defaultValue={firstProfile}>
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
                    {key === '0' ? `Personal account - ${value.email}` : capitalize(value.type)}
                  </P>
                )}
              </Flex>
              {key === 'new-org' && checked && (
                <Container as="fieldset" border="none" width={1} py={3} onChange={onFieldChange}>
                  <Box mb={3}>
                    <StyledInputField label="Org Name" htmlFor="orgName" error={getFieldError('orgName')}>
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
                <Container flex="1 1 auto" textAlign="right">
                  <Logo name={key} height="3rem" />
                </Container>
              )}
            </ContributeAsEntryContainer>
          )}
        </StyledRadioList>
      </StyledCard>
    );
  },
);

ContributeAs.propTypes = {
  /**
   * emits latest selected profile <br />
   * if anoymous is selected, only `{name: 'anonymous'}` is returned <br />
   * if 'A new organization' is selected, the latest data from that form is returned <br />
   * else the data passed to `profiles` or `personal` is returned
   */
  onChange: PropTypes.func,
  personal: PropTypes.shape({
    email: PropTypes.string,
    image: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
  }),
  profiles: PropTypes.objectOf(
    PropTypes.shape({
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
