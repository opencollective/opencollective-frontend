import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import { pick } from 'lodash';
import { Github } from '@styled-icons/fa-brands/Github';
import { Star } from '@styled-icons/fa-solid/Star';

import Container from './Container';
import { P, Span } from './Text';
import StyledInputField from './StyledInputField';
import StyledInputGroup from './StyledInputGroup';
import StyledInput from './StyledInput';
import StyledButton from './StyledButton';
import Link from './Link';
import StyledRadioList from './StyledRadioList';
import ExternalLink from './ExternalLink';
import { FormattedMessage } from 'react-intl';

const useForm = () => {
  const [state, setState] = useState({ errors: '', useType: 'repository' });
  return {
    getFieldError: name => state.errors[name],
    getFieldProps: () => ({
      defaultValue: state[name] || '',
      fontSize: 'Paragraph',
      lineHeight: 'Paragraph',
      onChange: event => {
        event.stopPropagation();
        const { target } = event;
        setState(state => ({
          [target.name]: target.value,
          errors: { ...state.errors, [target.name]: null },
        }));
      },
      onInvalid: event => {
        event.persist();
        event.preventDefault();
        setState(state => ({
          errors: { ...state.errors, [event.target.name]: event.target.validationMessage },
        }));
      },
      type: 'text',
      width: 1,
    }),
    state,
    setState,
  };
};

const FISCAL_SPONSOR_TERMS =
  'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub';

const RepositoryEntry = ({ onCreateCollective, radio, value, checked, creatingCollective }) => {
  const { type, login } = value.owner;
  const repositoryTypeName = type === 'User' ? 'Personal Repo' : 'Organization Repo';
  const { getFieldError, getFieldProps, state, setState } = useForm();

  return (
    <Fragment>
      <Container display="flex" justifyContent="space-between" alignItems="flex-start">
        <Container display="flex">
          <Span mr={3}>{radio}</Span>
          <Span mr={3} color="black.300">
            <Github size={40} />
          </Span>
          <span>
            <P fontWeight={500} fontSize="1.4rem">
              {value.full_name}
            </P>
            <P textTransform="uppercase" color="black.400" fontSize="1rem">
              {repositoryTypeName}
            </P>
          </span>
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
              if (state.useType === 'organization') {
                data.githubHandle = login;
                data.githubRepo = value.full_name;
              } else {
                data.githubHandle = value.full_name;
              }
              onCreateCollective(data);
            }}
          >
            {type === 'Organization' && (
              <StyledRadioList
                id="useType"
                name="useType"
                options={['repository', 'organization']}
                defaultValue={'repository'}
                onChange={({ key }) => {
                  setState({
                    useType: key,
                  });
                }}
              >
                {props => {
                  return (
                    <Container cursor="pointer">
                      {props.value === 'repository' && (
                        <Container fontWeight="400" fontSize="1.2rem" mb={2}>
                          <Span mr={3}>{props.radio}</Span>
                          Create a collective for the repository ({value.name})
                        </Container>
                      )}
                      {props.value === 'organization' && (
                        <Container fontWeight="400" fontSize="1.2rem" mb={4}>
                          <Span mr={3}>{props.radio}</Span>
                          Create a collective for the organization ({login})
                        </Container>
                      )}
                    </Container>
                  );
                }}
              </StyledRadioList>
            )}

            <P fontSize="1.6rem" fontWeight="bold" mb={3}>
              {'Please enter the Collective’s info:'}
            </P>

            <Box mb={3} mt={4}>
              <StyledInputField
                label={<FormattedMessage id="GithubFlow.CollectiveName" defaultMessage="Collective name" />}
                htmlFor="name"
                error={getFieldError('name')}
              >
                {inputProps => <StyledInput {...inputProps} {...getFieldProps(inputProps.name)} required width={1} />}
              </StyledInputField>
            </Box>

            <Box mb={3}>
              <StyledInputField
                label={<FormattedMessage id="GithubFlow.CollectiveURL" defaultMessage="Collective URL" />}
                htmlFor="slug"
                error={getFieldError('slug')}
              >
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
                <FormattedMessage id="collective.create.button" defaultMessage="Create Collective" />
              </StyledButton>
            </Container>
            <P textAlign="center" color="black.500" fontSize="1.2rem" fontWeight="normal">
              <FormattedMessage
                id="contributeFlow.createProfile.legal"
                defaultMessage="By pressing ‘Create Collective’ you agree to our <tos-link>Terms of Service</tos-link>, to the <host-terms>Terms of Fiscal Sponsorship</host-terms> and to the <privacy-policy-link>Privacy Policy</privacy-policy-link> of the Fiscal Host that will collect money on behalf of this collective."
                values={{
                  // eslint-disable-next-line
                  'tos-link': msg => <Link route="/tos">{msg}</Link>,
                  // eslint-disable-next-line
                  'host-terms': msg => (
                    <ExternalLink href={FISCAL_SPONSOR_TERMS} openInNewTab>
                      {msg}
                    </ExternalLink>
                  ),
                  // eslint-disable-next-line
                  'privacy-policy-link': msg => <Link route="/privacypolicy">{msg}</Link>,
                }}
              />
            </P>
          </Container>
        )}
      </Container>
    </Fragment>
  );
};

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
