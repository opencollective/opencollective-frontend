import React from 'react';
import PropTypes from 'prop-types';
import { Field, Form, Formik } from 'formik';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../../lib/collective.lib';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import { H1, P } from '../Text';

const ContainerWithImage = styled(Container)`
  @media screen and (min-width: 40em) {
    background: url('/static/images/create-collective/formIllustration.png');
    background-repeat: no-repeat;
    background-size: 40%;
    background-position: right bottom;
  }
`;

const placeholders = {
  name: 'Agora Fund',
  slug: 'agora',
};

const messages = defineMessages({
  nameLabel: { id: 'createFund.form.nameLabel', defaultMessage: "What's the name of your fund?" },
  slugLabel: { id: 'createCollective.form.slugLabel', defaultMessage: 'What URL would you like?' },
  suggestedLabel: { id: 'createCollective.form.suggestedLabel', defaultMessage: 'Suggested' },
  descriptionLabel: {
    id: 'createFund.form.descriptionLabel',
    defaultMessage: 'What does your fund do?',
  },
  descriptionHint: {
    id: 'createFund.form.descriptionHint',
    defaultMessage: 'Write a short description of your Fund (150 characters max)',
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
});

class CreateFundForm extends React.Component {
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

  render() {
    const { intl, error, host, loading } = this.props;

    const initialValues = {
      name: '',
      description: '',
      slug: '',
    };

    const validate = values => {
      const errors = {};

      if (values.name.length > 50) {
        errors.name = intl.formatMessage(messages.errorName);
      }

      if (values.slug.length > 30) {
        errors.slug = intl.formatMessage(messages.errorSlug);
      }

      if (values.description.length > 160) {
        errors.description = intl.formatMessage(messages.errorDescription);
      }

      return errors;
    };

    const submit = values => {
      const { description, name, slug } = values;
      this.props.onSubmit({ name, description, slug });
    };

    return (
      <Flex flexDirection="column" m={[3, 0]}>
        <Flex flexDirection="column" my={[2, 4]}>
          <Box mb={[2, 3]}>
            <H1
              fontSize={['20px', '32px']}
              lineHeight={['24px', '36px']}
              fontWeight="bold"
              textAlign="center"
              color="black.900"
            >
              <FormattedMessage id="createFund.create" defaultMessage="Create a Fund" />
            </H1>
          </Box>
          <Box textAlign="center" minHeight="24px">
            <P fontSize="16px" color="black.600" mb={2}>
              <FormattedMessage
                id="createFund.subtitle.introduce"
                defaultMessage="Apply for Fiscal Sponsorship below. We will review your application shortly. {faqLink}"
                values={{
                  faqLink: (
                    <StyledLink href="https://docs.opencollective.foundation/" openInNewTab>
                      <FormattedMessage id="createFund.subtitle.faq" defaultMessage="FAQ here." />
                    </StyledLink>
                  ),
                }}
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

                const handleSlugChange = e => {
                  if (!touched.slug) {
                    setFieldValue('slug', suggestSlug(e.target.value));
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
                      <P fontSize="13px" mb={2}>
                        -{' '}
                        <FormattedMessage
                          id="createFund.tos.label"
                          defaultMessage="Read the {toslink} of Open Collective."
                          values={{
                            toslink: (
                              <StyledLink href="/tos" openInNewTab>
                                <FormattedMessage id="tos" defaultMessage="terms of service" />
                              </StyledLink>
                            ),
                          }}
                        />
                      </P>
                      {host && host.termsUrl && (
                        <P fontSize="13px">
                          -{' '}
                          <FormattedMessage
                            id="createFund.hosttos.label"
                            defaultMessage="Read the {hosttoslink} of the Open Collective Foundation."
                            values={{
                              hosttoslink: (
                                <StyledLink href={host.termsUrl} openInNewTab>
                                  <FormattedMessage id="fiscaltos" defaultMessage="terms of fiscal sponsorship" />
                                </StyledLink>
                              ),
                            }}
                          />
                        </P>
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
                        <FormattedMessage id="createFund.button" defaultMessage="Create Fund" />
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

export default injectIntl(withRouter(CreateFundForm));
