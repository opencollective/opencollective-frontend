import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { Field, Form, Formik } from 'formik';
import { trim } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import slugify from 'slugify';
import styled from 'styled-components';

import CollectiveNavbar from '../CollectiveNavbar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import { H1, P } from '../Text';

const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: 14px;
`;

const ContainerWithImage = styled(Container)`
  @media screen and (min-width: 40em) {
    background: url('/static/images/create-collective/formIllustration.png');
    background-repeat: no-repeat;
    background-size: 40%;
    background-position: right bottom;
  }
`;

const placeholders = {
  name: 'Agora Collective',
  slug: 'agora',
};

const messages = defineMessages({
  nameLabel: { id: 'createCollective.form.nameLabel', defaultMessage: "What's the name of your collective?" },
  slugLabel: { id: 'createCollective.form.slugLabel', defaultMessage: 'What URL would you like?' },
  suggestedLabel: { id: 'createCollective.form.suggestedLabel', defaultMessage: 'Suggested' },
  descriptionLabel: {
    id: 'createCollective.form.descriptionLabel',
    defaultMessage: 'What does your collective do?',
  },
  descriptionHint: {
    id: 'createCollective.form.descriptionHint',
    defaultMessage: 'Write a short description of your Collective (150 characters max)',
  },
  descriptionPlaceholder: {
    id: 'create.collective.placeholder',
    defaultMessage: 'Making the world a better place',
  },
  errorName: {
    id: 'createCollective.form.error.name',
    defaultMessage: 'Please use fewer than 50 characters',
  },
  errorDescription: {
    id: 'createCollective.form.error.description',
    defaultMessage: 'Please use fewer than 160 characters',
  },
  errorSlug: {
    id: 'createCollective.form.error.slug',
    defaultMessage: 'Please use fewer than 30 characters',
  },
  errorSlugHyphen: {
    id: 'createCollective.form.error.slug.hyphen',
    defaultMessage: 'Collective slug can not start nor end with hyphen',
  },
});

const formatGithubRepoName = repoName => {
  // replaces dash and underscore with space, then capitalises the words
  return repoName.replace(/[-_]/g, ' ').replace(/(?:^|\s)\S/g, words => words.toUpperCase());
};

class CreateCollectiveForm extends React.Component {
  static propTypes = {
    error: PropTypes.string,
    host: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    github: PropTypes.object,
    router: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      tos: false,
      hostTos: false,
    };
  }

  componentDidMount() {
    const { category, step, hostTos } = this.props.router.query;
    // first condition is if they are coming from Github stars, second is if they are coming from request manual verification
    if ((category === 'opensource' && step === 'form') || hostTos) {
      this.setState({ hostTos: true });
    }
  }

  render() {
    const { intl, error, host, loading, github, router } = this.props;

    const initialValues = {
      name: github ? formatGithubRepoName(github.repo) : '',
      description: '',
      slug: github ? github.repo : '',
    };

    const validate = values => {
      const errors = {};

      if (values.name.length > 50) {
        errors.name = intl.formatMessage(messages.errorName);
      }

      if (values.slug.length > 30) {
        errors.slug = intl.formatMessage(messages.errorSlug);
      }
      if (values.slug !== trim(values.slug, '-')) {
        errors.slug = intl.formatMessage(messages.errorSlugHyphen);
      }

      if (values.description.length > 160) {
        errors.description = intl.formatMessage(messages.errorDescription);
      }

      return errors;
    };

    const submit = values => {
      const { description, name, slug } = values;
      const { tos, hostTos } = this.state;
      this.props.onSubmit({ name, description, slug, tos, hostTos });
    };

    return (
      <Flex flexDirection="column" m={[3, 0]}>
        {host && host.slug !== 'opensource' && (
          <Container mb={4}>
            <CollectiveNavbar collective={host} onlyInfos={true} />
          </Container>
        )}
        <Flex flexDirection="column" my={[2, 4]}>
          <Box textAlign="left" minHeight="32px" marginLeft={['none', '224px']}>
            <BackButton asLink onClick={() => window && window.history.back()}>
              ←&nbsp;
              <FormattedMessage id="Back" defaultMessage="Back" />
            </BackButton>
          </Box>
          <Box mb={[2, 3]}>
            <H1
              fontSize={['20px', '32px']}
              lineHeight={['24px', '36px']}
              fontWeight="bold"
              textAlign="center"
              color="black.900"
            >
              <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
            </H1>
          </Box>
          <Box textAlign="center" minHeight="24px">
            <P fontSize="16px" color="black.600" mb={2}>
              <FormattedMessage
                id="createCollective.subtitle.introduce"
                defaultMessage="Introduce your Collective to the community."
              />
            </P>
          </Box>
        </Flex>
        {error && (
          <Flex alignItems="center" justifyContent="center">
            <MessageBox type="error" withIcon mb={[1, 3]} data-cy="ccf-error-message">
              {error}
            </MessageBox>
          </Flex>
        )}
        <Flex alignItems="center" justifyContent="center">
          <ContainerWithImage
            mb={[1, 5]}
            width={[320, 512, 576]}
            border={['none', '1px solid #E6E8EB']}
            borderRadius={['none', '8px']}
            px={[1, 4]}
          >
            <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
              {formik => {
                const { values, handleSubmit, errors, touched, setFieldValue } = formik;

                const suggestedSlug = value => {
                  const slugOptions = {
                    replacement: '-',
                    lower: true,
                    strict: true,
                  };

                  return trim(slugify(value, slugOptions), '-');
                };

                const handleSlugChange = e => {
                  if (!touched.slug) {
                    setFieldValue('slug', suggestedSlug(e.target.value));
                  }
                };

                return (
                  <Form>
                    <StyledInputField
                      name="name"
                      htmlFor="name"
                      error={touched.name && errors.name}
                      label={intl.formatMessage(messages.nameLabel)}
                      value={values.name}
                      onChange={handleSlugChange}
                      required
                      mt={4}
                      mb={3}
                      data-cy="ccf-form-name"
                    >
                      {inputProps => <Field as={StyledInput} {...inputProps} placeholder={placeholders.name} />}
                    </StyledInputField>
                    <StyledInputField
                      name="slug"
                      htmlFor="slug"
                      error={touched.slug && errors.slug}
                      label={intl.formatMessage(messages.slugLabel)}
                      value={values.slug}
                      required
                      mt={3}
                      mb={2}
                      data-cy="ccf-form-slug"
                    >
                      {inputProps => (
                        <Field
                          onChange={e => {
                            setFieldValue('slug', e.target.value);
                          }}
                          as={StyledInputGroup}
                          {...inputProps}
                          prepend="opencollective.com/"
                          placeholder={placeholders.slug}
                        />
                      )}
                    </StyledInputField>
                    {values.name.length > 0 && !touched.slug && (
                      <P fontSize="10px">{intl.formatMessage(messages.suggestedLabel)}</P>
                    )}
                    <StyledInputField
                      name="description"
                      htmlFor="description"
                      error={touched.description && errors.description}
                      label={intl.formatMessage(messages.descriptionLabel)}
                      value={values.description}
                      required
                      mt={3}
                      mb={2}
                      data-cy="ccf-form-description"
                    >
                      {inputProps => (
                        <Field
                          as={StyledInput}
                          {...inputProps}
                          placeholder={intl.formatMessage(messages.descriptionPlaceholder)}
                        />
                      )}
                    </StyledInputField>
                    <P fontSize="11px">{intl.formatMessage(messages.descriptionHint)}</P>

                    <Flex flexDirection="column" mx={1} my={4}>
                      <StyledCheckbox
                        name="tos"
                        label={
                          <FormattedMessage
                            id="createcollective.tos.label"
                            defaultMessage="I agree with the {toslink} of Open Collective."
                            values={{
                              toslink: (
                                <StyledLink href="/tos" openInNewTab>
                                  <FormattedMessage id="tos" defaultMessage="terms of service" />
                                </StyledLink>
                              ),
                            }}
                          />
                        }
                        required
                        onChange={({ checked }) => {
                          this.setState({ tos: checked });
                        }}
                      />
                      {!router.query.hostTos && host && host.termsUrl && (
                        <StyledCheckbox
                          alignItems="flex-start"
                          name="hostTos"
                          label={
                            <FormattedMessage
                              id="createcollective.hosttos.label"
                              defaultMessage="I agree with the the {hosttoslink} of the host that will collect money on behalf of our collective."
                              values={{
                                hosttoslink: (
                                  <StyledLink href={host.termsUrl} openInNewTab>
                                    <FormattedMessage id="fiscaltos" defaultMessage="terms of fiscal sponsorship" />
                                  </StyledLink>
                                ),
                              }}
                            />
                          }
                          required
                          onChange={({ checked }) => {
                            this.setState({ hostTos: checked });
                          }}
                        />
                      )}
                    </Flex>

                    <Flex justifyContent={['center', 'left']} mb={4}>
                      <StyledButton
                        fontSize="13px"
                        minWidth="148px"
                        minHeight="36px"
                        buttonStyle="primary"
                        type="submit"
                        loading={loading}
                        onSubmit={handleSubmit}
                        data-cy="ccf-form-submit"
                      >
                        <FormattedMessage id="collective.create.button" defaultMessage="Create Collective" />
                      </StyledButton>
                    </Flex>
                  </Form>
                );
              }}
            </Formik>
            <Flex justifyContent="center" mb={4} display={['flex', 'none']}>
              <Illustration
                display={['block', 'none']}
                src="/static/images/create-collective/mobileForm.png"
                width="320px"
                height="200px"
              />
            </Flex>
          </ContainerWithImage>
        </Flex>
      </Flex>
    );
  }
}

export default injectIntl(withRouter(CreateCollectiveForm));
