import React, { useEffect, useState } from 'react';
// import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { isURL } from 'validator';

import { sendContactMessage } from '../../lib/api';
import { createError, ERROR, i18nGraphqlException } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { getCollectivePageCanonicalURL } from '../../lib/url-helpers';
import { isValidEmail } from '../../lib/utils';

import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Box, Flex } from '../Grid';
// import Link from '../Link';
import MessageBox from '../MessageBox';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import { P, Span } from '../Text';

const validate = values => {
  const errors = {};
  const { name, topic, email, message, link } = values;

  if (!name) {
    errors.name = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!topic) {
    errors.topic = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!email) {
    errors.email = createError(ERROR.FORM_FIELD_REQUIRED);
  } else if (!isValidEmail(email)) {
    errors.email = createError(ERROR.FORM_FIELD_PATTERN);
  }

  if (link && !isURL(link)) {
    errors.link = createError(ERROR.FORM_FIELD_PATTERN);
  }

  if (!message) {
    errors.message = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  return errors;
};

const ContactForm = () => {
  const intl = useIntl();
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getFieldProps, handleSubmit, errors, touched, setFieldValue } = useFormik({
    initialValues: {
      name: '',
      email: '',
      topic: '',
      message: '',
      link: '',
      relatedCollectives: [],
    },
    validate,
    onSubmit: values => {
      setIsSubmitting(true);
      if (values.relatedCollectives.length === 0 && LoggedInUser) {
        setFieldValue(
          'relatedCollectives',
          LoggedInUser.memberOf.map(member => {
            if (member.role === 'ADMIN') {
              return getCollectivePageCanonicalURL(member.collective);
            }
          }),
        );
      }
      sendContactMessage(values)
        .then(() => {
          setIsSubmitting(false);
          return router.push('/contact/success');
        })
        .catch(error => {
          setIsSubmitting(false);
          setSubmitError(error.message || 'An error occur submitting this issue, try again');
        });
    },
  });

  useEffect(() => {
    if (LoggedInUser) {
      setFieldValue('name', LoggedInUser.collective.name);
      setFieldValue('email', LoggedInUser.email);
      setFieldValue(
        'relatedCollectives',
        LoggedInUser.memberOf
          .filter(member => member.role === 'ADMIN')
          .map(member => getCollectivePageCanonicalURL(member.collective)),
      );
    }
  }, [LoggedInUser]);

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" px="16px" mt="48px" mb="120px">
      <Container display="flex" justifyContent="center" alignItems="center" position="relative">
        <Container
          height="825px"
          width="825px"
          position="absolute"
          backgroundImage={[null, "url('/static/images/help-and-support/contactForm-illustrations.png')"]}
          backgroundRepeat="no-repeat"
          backgroundSize={[null, 'contain', 'contain']}
          display={['none', 'block']}
          top="-200px"
          left="-75px"
        />
        <StyledCard
          padding={[null, '32px']}
          boxShadow={[null, '0px 0px 15px 10px rgba(13, 67, 97, 0.05)']}
          borderRadius={[null, '8px']}
          borderWidth="0"
          width={['288px', '510px']}
          zIndex="999"
        >
          {submitError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon mb={[1, 3]}>
                {i18nGraphqlException(intl, submitError)}
              </MessageBox>
            </Flex>
          )}
          <form onSubmit={handleSubmit}>
            {!LoggedInUser && (
              <React.Fragment>
                <Box mb="28px">
                  <StyledInputField
                    label={<FormattedMessage defaultMessage="Your name" />}
                    labelFontWeight="700"
                    labelProps={{
                      lineHeight: '24px',
                      fontSize: '16px',
                    }}
                    {...getFieldProps('name')}
                    error={touched.name && formatFormErrorMessage(intl, errors.name)}
                  >
                    {inputProps => <StyledInput {...inputProps} placeholder="Enter your first name" width="100%" />}
                  </StyledInputField>
                </Box>
                <Box mb="28px">
                  <StyledInputField
                    label={<FormattedMessage defaultMessage="Your email" />}
                    labelFontWeight="700"
                    labelProps={{
                      lineHeight: '24px',
                      fontSize: '16px',
                    }}
                    {...getFieldProps('email')}
                    error={touched.email && formatFormErrorMessage(intl, errors.email)}
                    hint={
                      <FormattedMessage
                        id="helpAndSupport.email.description"
                        defaultMessage="Enter the email ID used for the concerned issue"
                      />
                    }
                  >
                    {inputProps => <StyledInput {...inputProps} placeholder="e.g. johndoe@gmail.com" width="100%" />}
                  </StyledInputField>
                </Box>
              </React.Fragment>
            )}
            <Box mb="28px">
              <StyledInputField
                label={
                  <FormattedMessage
                    id="helpAndSupport.contactForm.topicRequest"
                    defaultMessage="What's the topic of your request?"
                  />
                }
                {...getFieldProps('topic')}
                labelFontWeight="700"
                labelProps={{
                  lineHeight: '24px',
                  fontSize: '16px',
                }}
                error={touched.topic && formatFormErrorMessage(intl, errors.topic)}
                hint={
                  <FormattedMessage
                    id="helpAndSupport.topicRequest.description"
                    defaultMessage="Enter the topic of your concern."
                  />
                }
              >
                {inputProps => <StyledInput {...inputProps} placeholder="e.g. Transactions, profile" width="100%" />}
              </StyledInputField>
            </Box>
            <Box mb="28px">
              <StyledInputField
                required={false}
                label={<FormattedMessage defaultMessage="Enter related Collectives" />}
                {...getFieldProps('relatedCollectives')}
                labelFontWeight="700"
                labelProps={{
                  lineHeight: '24px',
                  fontSize: '16px',
                }}
                error={touched.relatedCollectives && formatFormErrorMessage(intl, errors.relatedCollectives)}
                hint={<FormattedMessage defaultMessage="Enter collectives related to your request." />}
              >
                {inputProps => (
                  <CollectivePickerAsync
                    {...inputProps}
                    isMulti
                    useCompactMode
                    types={['COLLECTIVE', 'ORGANIZATION', 'EVENT', 'PROJECT', 'USER', 'FUND']}
                    createCollectiveOptionalFields={['location.address', 'location.country']}
                    onChange={value =>
                      setFieldValue(
                        'relatedCollectives',
                        value.map(element => getCollectivePageCanonicalURL(element.value)),
                      )
                    }
                  />
                )}
              </StyledInputField>
            </Box>
            <Box mb="28px">
              <P fontSize="16px" lineHeight="24px" fontWeight="700" mb="8px">
                <FormattedMessage id="helpAndSupport.contactForm.message" defaultMessage="What's your message?" />
              </P>
              <RichTextEditor
                error={touched.message && formatFormErrorMessage(intl, errors.message)}
                inputName="message"
                onChange={e => setFieldValue('message', e.target.value)}
                withBorders
                version="simplified"
                editorMinHeight="20rem"
              />
              <P mt="6px" fontSize="13px" lineHeight="20px" color="black.700">
                <FormattedMessage
                  id="helpAndSupport.message.description"
                  defaultMessage="Please give as much information as possible for a quicker resolution"
                />
              </P>
            </Box>
            <Box mb="28px">
              <StyledInputField
                label={
                  <FormattedMessage
                    id="helpAndSupport.contactForm.link"
                    defaultMessage="Add a link with files or something additional"
                  />
                }
                {...getFieldProps('link')}
                error={touched.link && formatFormErrorMessage(intl, errors.link)}
                labelFontWeight="700"
                labelProps={{
                  lineHeight: '24px',
                  fontSize: '16px',
                }}
                required={false}
                hint={
                  <FormattedMessage
                    id="helpAndSupport.link.description"
                    defaultMessage="We encourage you to include files or images in a cloud drive link."
                  />
                }
              >
                {inputProps => (
                  <StyledInputGroup
                    prepend="https://"
                    type="url"
                    {...inputProps}
                    placeholder="yourdrive.com"
                    width="100%"
                  />
                )}
              </StyledInputField>
            </Box>
            <Box
              display="flex"
              flexDirection={['column', 'row-reverse']}
              justifyContent={[null, 'space-between']}
              alignItems="center"
            >
              <StyledButton
                type="submit"
                width={['288px', '151px']}
                buttonSize="medium"
                buttonStyle="marketing"
                mb={['24px', 0]}
                loading={isSubmitting}
              >
                <FormattedMessage defaultMessage="Submit Issue" />
                <Span ml={['10px', '5px']}>
                  <ArrowRight2 size="14px" />
                </Span>
              </StyledButton>

              {/*
              <Link href="/help">
                <StyledButton
                  width={['288px', '151px']}
                  buttonSize="medium"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <ArrowLeft2 size="14px" />
                  <Span ml={['10px', '5px']}>
                    <FormattedMessage defaultMessage="Back to help" />
                  </Span>
                </StyledButton>
              </Link>
              */}
            </Box>
          </form>
        </StyledCard>
      </Container>
    </Flex>
  );
};

export default ContactForm;
