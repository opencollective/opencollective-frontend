import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { capitalize, omit, uniqBy, get } from 'lodash';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Box, Flex } from '@rebass/grid';

import { Search } from 'styled-icons/octicons/Search';

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
`;

const messages = defineMessages({
  anonymous: { id: 'profile.anonymous', defaultMessage: 'anonymous' },
  'org.new': { id: 'contributeAs.org.new', defaultMessage: 'A new organization' },
  'org.name': { id: 'contributeAs.org.name', defaultMessage: 'Organization Name' },
  'org.website': { id: 'contributeAs.org.website', defaultMessage: 'Website' },
  'org.twitter': { id: 'contributeAs.org.twitter', defaultMessage: 'Twitter (optional)' },
  'org.github': { id: 'contributeAs.org.github', defaultMessage: 'GitHub (optional)' },
});

const useForm = ({ onProfileChange }) => {
  const [state, setState] = useState({ errors: {} });
  return {
    getFieldError: name => state.errors[name],
    onChange: selected => {
      if (selected.key === 'org.new') {
        if (state.name && state.website) {
          return onProfileChange({ type: 'ORGANIZATION', ...omit(state, ['errors']) });
        } else {
          return onProfileChange(null);
        }
      }

      if (selected.key === 'anonymous') {
        const userData = { name: 'anonymous', type: 'USER', isAnonymous: true };
        setState({ ...state, ...userData, ...omit(state, ['errors']) });
        return onProfileChange(userData);
      }

      return onProfileChange(selected.value);
    },
    onFieldChange: event => {
      event.stopPropagation();

      const { target } = event;
      if (!target.validity.valid) {
        onProfileChange(null);
        setState({ ...state, [target.name]: undefined });
        return;
      }

      const newState = {
        ...state,
        [target.name]: target.value,
      };
      setState({
        ...newState,
        errors: { ...state.errors, [target.name]: null },
      });
      onProfileChange(omit(newState, ['errors']));
    },
    onSearch: ({ target }) => {
      setState(state => ({
        ...state,
        search: target.value,
      }));
    },
    getFieldProps: name => ({
      defaultValue: state[name] || '',
      fontSize: 'Paragraph',
      lineHeight: 'Paragraph',
      onBlur: event => {
        const hasValue = event.target.value;
        const wasUpdatedOnce = Object.prototype.hasOwnProperty.call(state, event.target.name);
        if (hasValue || wasUpdatedOnce) event.target.reportValidity();
      },
      onInvalid: event => {
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
          return {
            ...state,
            errors: { ...state.errors, [target.name]: error },
          };
        });
      },
      type: 'text',
      width: 1,
    }),
    state,
  };
};

/**
 * Search is displayed if 5 or more profiles are passed in.
 */
const ContributeAs = ({ intl, onProfileChange, personal, profiles, defaultSelectedProfile, ...fieldProps }) => {
  const { getFieldError, getFieldProps, onFieldChange, onSearch, onChange, state } = useForm({ onProfileChange });
  if (state.search) {
    const test = new RegExp(escapeInput(state.search), 'i');
    profiles = profiles.filter(profile => profile.name.match(test));
  }

  const options = uniqBy([personal, ...profiles], 'id');

  // if the user doesn't have an anonymous profile yet, we offer to create one
  const anonymousProfile = options.find(p => p.type === 'USER' && p.isAnonymous);
  if (!anonymousProfile) {
    options.push({ id: 'anonymous', type: 'USER', isAnonymous: true, name: intl.formatMessage(messages['anonymous']) });
  }

  options.push({ id: 'org.new', name: intl.formatMessage(messages['org.new']) });

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
            ml={2}
          />
        </Container>
      )}
      <StyledRadioList
        {...fieldProps}
        options={options}
        keyGetter="id"
        defaultValue={defaultSelectedProfile ? defaultSelectedProfile.id : undefined}
        onChange={onChange}
      >
        {({ key, value, radio, checked, index }) => (
          <ContributeAsEntryContainer
            display="flex"
            alignItems="center"
            px={4}
            py={3}
            borderBottom={lastIndex !== index ? '1px solid' : 'none'}
            color={value.isAnonymous && checked ? 'white.full' : 'black.900'}
            bg={value.isAnonymous && checked ? 'black.900' : 'white.full'}
            borderColor="black.200"
            flexWrap="wrap"
          >
            <Box as="span" mr={3}>
              {radio}
            </Box>
            {value.type === 'USER' && <Avatar collective={value} size="3.6rem" />}{' '}
            {value.type !== 'USER' && value.slug && <Logo collective={value} height="3.6rem" />}
            <Flex flexDirection="column" ml={2}>
              <P color="inherit" fontWeight={value.type ? 600 : 500}>
                {value.isAnonymous && <FormattedMessage id="profile.anonymous" defaultMessage="anonymous" />}
                {!value.isAnonymous && get(value, 'name', intl.formatMessage(messages['anonymous']))}
              </P>
              {!value.isAnonymous && value.type && (
                <P fontSize="Caption" lineHeight="Caption" color="black.500">
                  {value.type === 'USER' && value.name ? (
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
            {key === 'org.new' && checked && (
              <Container as="fieldset" border="none" width={1} py={3} onChange={onFieldChange}>
                <Box mb={3}>
                  <StyledInputField
                    label={intl.formatMessage(messages['org.name'])}
                    htmlFor="name"
                    error={getFieldError('name')}
                  >
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
                  <StyledInputField
                    label={intl.formatMessage(messages['org.website'])}
                    htmlFor="website"
                    error={getFieldError('website')}
                  >
                    {inputProps => (
                      <StyledInput
                        {...inputProps}
                        {...getFieldProps(inputProps.name)}
                        placeholder="https://example.com"
                        type="url"
                        required
                      />
                    )}
                  </StyledInputField>
                </Box>

                <Box mb={3}>
                  <StyledInputField
                    label={intl.formatMessage(messages['org.github'])}
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
                    label={intl.formatMessage(messages['org.twitter'])}
                    htmlFor="twitterHandle"
                    error={getFieldError('twitterHandle')}
                  >
                    {inputProps => <StyledInputGroup {...inputProps} {...getFieldProps(inputProps.name)} prepend="@" />}
                  </StyledInputField>
                </Box>
              </Container>
            )}
          </ContributeAsEntryContainer>
        )}
      </StyledRadioList>
    </StyledCard>
  );
};

ContributeAs.displayName = 'ContributeAs';

ContributeAs.propTypes = {
  /**
   * emits latest selected profile
   *
   *  - if anonymous is selected, only `{name: 'anonymous', type: 'USER', isAnonymous: true}` is returned
   *  - if 'A new organization' is selected, the latest data from that form is returned
   *  - else the data passed to `profiles` or `personal` is returned
   */
  intl: PropTypes.object.isRequired,
  onProfileChange: PropTypes.func,
  defaultSelectedProfile: PropTypes.shape({
    id: PropTypes.number,
  }),
  personal: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string,
    image: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
  }),
  profiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      email: PropTypes.string,
      image: PropTypes.string,
      name: PropTypes.string,
      type: PropTypes.string,
      isAnonymous: PropTypes.bool,
    }),
  ),
};

ContributeAs.defaultProps = {
  onProfileChange: () => {}, // noop
};

export default injectIntl(ContributeAs);
