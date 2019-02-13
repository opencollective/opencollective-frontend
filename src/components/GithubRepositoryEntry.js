import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import { pick } from 'lodash';
import { Github } from 'styled-icons/fa-brands/Github.cjs';
import { Star } from 'styled-icons/fa-solid/Star.cjs';
import { withState, withHandlers, compose } from 'recompose';

import { colors } from '../constants/theme';
import Container from './Container';
import { P } from './Text';
import StyledInputField from './StyledInputField';
import StyledInputGroup from './StyledInputGroup';
import StyledInput from './StyledInput';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import Link from './Link';

const enhance = compose(
  withState('state', 'setState', ({ errors = {} }) => ({ errors, useOrg: false })),
  withHandlers({
    getFieldError: ({ state }) => name => state.errors[name],
    onChange: ({ setState }) => event => {
      event.stopPropagation();
      const { target } = event;

      setState(state => ({
        ...state,
        [target.name]: target.value,
        errors: { ...state.errors, [target.name]: null },
      }));
    },
    onInvalid: ({ setState }) => event => {
      event.persist();
      event.preventDefault();
      setState(state => ({
        ...state,
        errors: { ...state.errors, [event.target.name]: event.target.validationMessage },
      }));
    },
  }),
  // follows composition of onChange && onInvalid to access them from props
  withHandlers({
    getFieldProps: ({ state, onChange, onInvalid }) => name => ({
      defaultValue: state[name] || '',
      fontSize: 'Paragraph',
      lineHeight: 'Paragraph',
      onChange,
      onInvalid,
      type: 'text',
      width: 1,
    }),
  }),
);

const RepositoryEntry = enhance(
  ({
    getFieldError,
    getFieldProps,
    onCreateCollective,
    radio,
    value,
    checked,
    state,
    creatingCollective,
    setState,
  }) => {
    const { type, login } = value.owner;
    const repositoryTypeName = type === 'User' ? 'Personal Repo' : 'Organization Repo';

    return (
      <Fragment>
        <Container display="flex" justifyContent="space-between" alignItems="flex-start">
          <Container display="flex">
            <Box as="span" mr={3}>
              {radio}
            </Box>
            <Box as="span" mr={3}>
              <Github size={40} color={colors.black[300]} />
            </Box>
            <Box as="span">
              <P fontWeight={500} fontSize="1.4rem">
                {value.full_name}
              </P>
              <P textTransform="uppercase" color="black.400" fontSize="1rem">
                {repositoryTypeName}
              </P>
            </Box>
          </Container>
          <Container>
            <Box>
              <P fontWeight={300} fontSize="1.2rem">
                {value.stargazers_count} <Star size={12} />
              </P>
            </Box>
          </Container>
        </Container>
        <Container width={1} mx={3} my={2} px={2}>
          {value.description && (
            <P color="black.600" fontSize="1.2rem" fontWeight="400">
              {value.description}
            </P>
          )}
          {checked && (
            <Container
              as="form"
              my={3}
              method="POST"
              onSubmit={event => {
                event.preventDefault();
                const data = pick(state, ['name', 'slug']);
                if (state.useOrg) {
                  data.githubHandle = login;
                } else {
                  data.githubHandle = value.full_name;
                }
                onCreateCollective(data);
              }}
            >
              <P fontSize="1.6rem" fontWeight="bold" mb={4}>
                {'Please enter the Collective’s info:'}
              </P>
              {type === 'Organization' && (
                <StyledCheckbox
                  name="useOrg"
                  label={`Use GitHub organization (${value.owner.login})`}
                  onChange={({ checked }) => {
                    setState(state => ({
                      ...state,
                      useOrg: checked,
                    }));
                  }}
                />
              )}
              <Box mb={3} mt={4}>
                <StyledInputField label="Collective name" htmlFor="name" error={getFieldError('name')}>
                  {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} required width={1} />}
                </StyledInputField>
              </Box>

              <Box mb={3}>
                <StyledInputField label="Collective URL" htmlFor="slug" error={getFieldError('slug')}>
                  {inputProps => (
                    <StyledInputGroup
                      {...inputProps}
                      {...getFieldProps(inputProps.name)}
                      prepend="opencollective.com/"
                      required
                    />
                  )}
                </StyledInputField>
              </Box>

              <Container mb={3} width={1} textAlign="center">
                <StyledButton
                  buttonStyle="primary"
                  width={1}
                  buttonSize="medium"
                  disabled={!state.name || !state.slug}
                  loading={creatingCollective}
                  type="submit"
                >
                  Create collective
                </StyledButton>
              </Container>
              <P textAlign="center" color="black.500" fontSize="1.2rem" fontWeight="normal">
                By pressing ‘Create Collective’ you agree to our <Link route="/tos">Terms of Service</Link> and the{' '}
                <Link route="/privacypolicy">Privacy Policy</Link> of the Fiscal Host that will collect money on behalf
                of this collective.
              </P>
            </Container>
          )}
        </Container>
      </Fragment>
    );
  },
);

RepositoryEntry.propTypes = {
  radio: PropTypes.object,
  value: PropTypes.shape({
    description: PropTypes.string,
    owner: PropTypes.object,
    stargazers_count: PropTypes.number,
    full_name: PropTypes.string,
    name: PropTypes.string,
  }),
  checked: PropTypes.bool,
  creatingCollective: PropTypes.bool,
  onCreateCollective: PropTypes.func,
};

export default RepositoryEntry;
