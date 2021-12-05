import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { useFormik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { isValidEmail } from '../../lib/utils';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { P, Span } from '../Text';

const validate = values => {
  const errors = {};
  const { name, topic, email, message } = values;

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

  if (!message) {
    errors.message = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  return errors;
};

const ContactForm = () => {
  const intl = useIntl();
  const { getFieldProps, handleSubmit, errors, touched } = useFormik({
    initialValues: {
      name: '',
      email: '',
      topic: '',
      message: '',
    },
    validate,
    onSubmit: async values => {
      console.log(values);
    },
  });

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" px="16px" mt="48px" mb="120px">
      <Container
        width={[null, '597px', '901px']}
        backgroundImage={[null, "url('/static/images/help-and-support/contactForm-illustrations.png')"]}
        backgroundRepeat="no-repeat"
        backgroundSize={[null, 'contain', 'cover']}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <StyledCard
          padding={[null, '32px']}
          boxShadow={[null, '0px 0px 15px 10px rgba(13, 67, 97, 0.05)']}
          borderRadius={[null, '8px']}
          borderWidth="0"
          width={['288px', '510px']}
        >
          <form onSubmit={handleSubmit}>
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
              <P fontSize="16px" lineHeight="24px" fontWeight="700" mb="8px">
                <FormattedMessage id="helpAndSupport.contactForm.message" defaultMessage="What's your message?" />
              </P>
              <RichTextEditor
                error={touched.message && formatFormErrorMessage(intl, errors.message)}
                inputName="message"
                {...getFieldProps('message')}
                withBorders
              />
              <P mt="6px" fontSize="13px" lineHeight="20px" color="black.700">
                <FormattedMessage
                  id="helpAndSupport.message.description"
                  defaultMessage="Please give as much information as possible for a quicker resolution"
                />
              </P>
            </Box>
            <Box display="flex" justifyContent={[null, 'flex-end']}>
              <StyledButton width={['288px', '151px']} buttonStyle="dark">
                <FormattedMessage defaultMessage="Submit Issue" />
                <Span ml={['10px', '5px']}>
                  <ArrowRight2 size="14px" />
                </Span>
              </StyledButton>
            </Box>
          </form>
        </StyledCard>
      </Container>
    </Flex>
  );
};

export default ContactForm;
