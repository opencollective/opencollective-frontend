import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { Form, Formik } from 'formik';
import { get, trim } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../../lib/collective.lib';
import { OPENSOURCE_COLLECTIVE_ID } from '../../lib/constants/collectives';
import { requireFields, verifyChecked, verifyFieldLength } from '../../lib/form-utils';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { getI18nLink } from '../I18nFormatters';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import StyledTextarea from '../StyledTextarea';
import { H1, P } from '../Text';

export const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: 14px;
`;

const ContainerWithImage = styled(Container)`
  width: 100%;
  @media screen and (min-width: 40em) {
    background: url('/static/images/create-collective/formIllustration.png');
    background-repeat: no-repeat;
    background-size: 40%;
    background-position: right 17px bottom;
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
  errorSlugHyphen: {
    id: 'createCollective.form.error.slug.hyphen',
    defaultMessage: 'Collective slug can not start nor end with hyphen',
  },
});

const formatGithubRepoName = repoName => {
  // replaces dash and underscore with space, then capitalises the words
  return repoName.replace(/[-_]/g, ' ').replace(/(?:^|\s)\S/g, words => words.toUpperCase());
};

const LABEL_STYLES = { fontWeight: 500, fontSize: '14px', lineHeight: '17px' };

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

  hasHostTerms() {
    if (!this.props.host) {
      return false;
    } else if (this.props.host.legacyId === OPENSOURCE_COLLECTIVE_ID) {
      // Already checked on previous step (Github flow)
      return false;
    } else {
      return Boolean(this.props.host.termsUrl);
    }
  }

  render() {
    const { intl, error, host, loading, github } = this.props;
    const hasHostTerms = this.hasHostTerms();

    const initialValues = {
      name: github ? formatGithubRepoName(github.repo) : '',
      description: '',
      slug: github ? github.repo : '',
      message: '',
      tos: false,
      hostTos: false,
    };

    const validate = values => {
      const errors = requireFields(values, ['name', 'slug', 'description']);

      if (values.slug !== trim(values.slug, '-')) {
        errors.slug = intl.formatMessage(messages.errorSlugHyphen);
      }

      verifyFieldLength(intl, errors, values, 'name', 1, 50);
      verifyFieldLength(intl, errors, values, 'slug', 1, 30);
      verifyFieldLength(intl, errors, values, 'description', 1, 160);
      verifyFieldLength(intl, errors, values, 'message', 0, 3000);

      verifyChecked(errors, values, 'tos');
      if (hasHostTerms) {
        verifyChecked(errors, values, 'hostTos');
      }

      return errors;
    };

    const submit = values => {
      const { description, name, slug, message } = values;
      this.props.onSubmit({ collective: { name, description, slug }, message });
    };

    return (
      <Grid gridTemplateColumns={['1fr', null, null, '1fr 576px 1fr']} pt={48}>
        <Container
          display={['none', null, null, 'flex']}
          minHeight="32px"
          justifyContent="center"
          alignItems="flex-start"
        >
          <BackButton asLink onClick={() => window && window.history.back()}>
            ←&nbsp;
            <FormattedMessage id="Back" defaultMessage="Back" />
          </BackButton>
        </Container>
        <Box>
          <Flex flexDirection="column" mb={[2, 4, 48]} px={2} pt={2}>
            {host ? (
              <Flex justifyContent="center" alignItems="center">
                <Box mr={3}>
                  <Avatar radius={96} collective={host} />
                </Box>
                <Box maxWidth={345}>
                  <H1
                    fontSize={['20px', '32px']}
                    lineHeight={['24px', '40px']}
                    fontWeight="500"
                    textAlign="left"
                    color="black.900"
                  >
                    <FormattedMessage
                      id="host.applyTo"
                      defaultMessage="Apply to {hostName}"
                      values={{ hostName: host.name }}
                    />
                  </H1>
                </Box>
              </Flex>
            ) : (
              <div>
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
                <P fontSize="16px" color="black.600" textAlign="center" mb={2}>
                  <FormattedMessage
                    id="createCollective.subtitle.introduce"
                    defaultMessage="Introduce your Collective to the community."
                  />
                </P>
              </div>
            )}
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
              border={[null, '1px solid #E6E8EB']}
              borderRadius={[0, '8px']}
              maxWidth={576}
              px={[2, 4]}
              pb={[0, 90]}
            >
              <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
                {formik => {
                  const { values, handleSubmit, touched, setFieldValue } = formik;

                  const handleSlugChange = e => {
                    if (!touched.slug) {
                      setFieldValue('slug', suggestSlug(e.target.value));
                    }
                  };

                  return (
                    <Form data-cy="ccf-form">
                      <StyledInputFormikField
                        name="name"
                        htmlFor="collective-name-input"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.nameLabel)}
                        onChange={handleSlugChange}
                        required
                        mt={4}
                        mb={3}
                        data-cy="ccf-form-name"
                      >
                        {({ field }) => <StyledInput {...field} placeholder={placeholders.name} />}
                      </StyledInputFormikField>
                      <StyledInputFormikField
                        name="slug"
                        htmlFor="collective-slug-input"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.slugLabel)}
                        value={values.slug}
                        required
                        mt={3}
                        mb={2}
                        data-cy="ccf-form-slug"
                      >
                        {({ field }) => (
                          <StyledInputGroup
                            onChange={e => setFieldValue('slug', e.target.value)}
                            {...field}
                            prepend="opencollective.com/"
                            placeholder={placeholders.slug}
                          />
                        )}
                      </StyledInputFormikField>
                      {values.name.length > 0 && !touched.slug && (
                        <P fontSize="10px" color="black.600" fontStyle="italic">
                          {intl.formatMessage(messages.suggestedLabel)}
                        </P>
                      )}
                      <StyledInputFormikField
                        name="description"
                        htmlFor="description"
                        labelProps={LABEL_STYLES}
                        label={intl.formatMessage(messages.descriptionLabel)}
                        value={values.description}
                        required
                        mt={3}
                        mb={2}
                        data-cy="ccf-form-description"
                      >
                        {({ field }) => (
                          <StyledInput {...field} placeholder={intl.formatMessage(messages.descriptionPlaceholder)} />
                        )}
                      </StyledInputFormikField>
                      <P fontSize="11px" color="black.600">
                        {intl.formatMessage(messages.descriptionHint)}
                      </P>

                      {host && (
                        <StyledInputFormikField
                          name="message"
                          htmlFor="apply-create-message"
                          labelProps={LABEL_STYLES}
                          required={false}
                          mt={24}
                          label={
                            get(host, 'settings.applyMessage') || (
                              <FormattedMessage
                                id="ApplyToHost.WriteMessage"
                                defaultMessage="Write a message to fiscal host"
                              />
                            )
                          }
                        >
                          {({ field }) => (
                            <StyledTextarea {...field} width="100%" minHeight={76} maxLength={3000} showCount />
                          )}
                        </StyledInputFormikField>
                      )}

                      <Box mx={1} my={3}>
                        <StyledInputFormikField name="tos" required>
                          {({ field }) => (
                            <StyledCheckbox
                              name={field.name}
                              required={field.required}
                              checked={field.value}
                              onChange={({ checked }) => setFieldValue(field.name, checked)}
                              error={field.error}
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
                            />
                          )}
                        </StyledInputFormikField>
                        {hasHostTerms && (
                          <StyledInputFormikField name="hostTos" required mt={2}>
                            {({ field }) => (
                              <StyledCheckbox
                                name={field.name}
                                required={field.required}
                                checked={field.value}
                                onChange={({ checked }) => setFieldValue(field.name, checked)}
                                error={field.error}
                                label={
                                  <FormattedMessage
                                    id="Host.TOSCheckbox"
                                    defaultMessage="I agree with the <TOSLink>terms of service</TOSLink> of {hostName}"
                                    values={{
                                      hostName: host.name,
                                      TOSLink: getI18nLink({ href: host.termsUrl, openInNewTabNoFollow: true }),
                                    }}
                                  />
                                }
                              />
                            )}
                          </StyledInputFormikField>
                        )}
                      </Box>

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
              <Container justifyContent="center" mb={4} display={['flex', 'none']}>
                <Illustration src="/static/images/create-collective/mobileForm.png" width="320px" height="200px" />
              </Container>
            </ContainerWithImage>
          </Flex>
        </Box>
        <div />
      </Grid>
    );
  }
}

export default injectIntl(withRouter(CreateCollectiveForm));
