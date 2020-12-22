import React from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/boxicons-solid/Lock';
import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { Question } from '@styled-icons/remix-line/Question';
import { useFormik } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';

import Container from '../Container';
import OCFHostApplicationFAQ from '../faqs/OCFHostApplicationFAQ';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import StyledTextarea from '../StyledTextarea';
import { H1, H4, P } from '../Text';

import OCFPrimaryButton from './OCFPrimaryButton';

const messages = defineMessages({
  locationLabel: {
    id: 'OCFHostApplication.location.label',
    defaultMessage: 'Your Location',
  },
  nameLabel: {
    id: 'OCFHostApplication.name.label',
    defaultMessage: 'Your Name',
  },
  emailLabel: {
    id: 'OCFHostApplication.email.label',
    defaultMessage: 'Your email address',
  },
  initiativeNameLabel: {
    id: 'OCFHostApplication.initiativeName.label',
    defaultMessage: 'What is the name of your initiative?',
  },
  slugLabel: {
    id: 'OCFHostApplication.slug.label',
    defaultMessage: 'What URL would you like?',
  },
  initiativeDurationLabel: {
    id: 'OCFHostApplication.initiativeDuration.label',
    defaultMessage: 'How long has your initiative been running?',
  },
  totalAmountRaisedLabel: {
    id: 'OCFHostApplication.totalAmountRaised.label',
    defaultMessage: 'If you have begun fundraising, how much money have you raised so far?',
  },
  totalAmountToBeRaisedLabel: {
    id: 'OCFHostApplication.totalAmountToBeRaised.label',
    defaultMessage: 'How much money do you want to fundraise?',
  },
  expectedFundingPartnerLabel: {
    id: 'OCFHostApplication.expectedFundingPartner.label',
    defaultMessage: 'Who do you expect to fund you?',
  },
  initiativeDescriptionLabel: {
    id: 'OCFHostApplication.initiativeDescription.label',
    defaultMessage: 'What does your initiative do?',
  },
  missionImpactExplanationLabel: {
    id: 'OCFHostApplication.missionImpactExplanation.label',
    defaultMessage: 'Please explain how your initiative furthers one or more of our mission impact areas:',
  },
  websiteAndSocialLinksLabel: {
    id: 'OCFHostApplication.websiteAndSocialLinks.label',
    defaultMessage: 'Website and / or social media links:',
  },
  additionalInfoLabel: {
    id: 'OCFHostApplication.additionalInfoLabel.label',
    defaultMessage: 'Anything you would like to add?',
  },
});

const validate = values => {
  const errors = {};
  if (!values.location) {
    errors.location = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.name) {
    errors.name = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.initiativeName) {
    errors.initiativeName = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.slug) {
    errors.slug = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.initiativeDuration) {
    errors.initiativeDuration = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.totalAmountRaised) {
    errors.totalAmountRaised = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.totalAmountToBeRaised) {
    errors.totalAmountToBeRaised = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.expectedFundingPartner) {
    errors.expectedFundingPartner = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.initiativeDescription) {
    errors.initiativeDescription = createError(ERROR.FORM_FIELD_REQUIRED);
  } else if (values.initiativeDescription.length < 250) {
    errors.initiativeDescription = createError(ERROR.FORM_FIELD_MIN_LENGTH);
  }

  if (!values.missionImpactExplanation) {
    errors.missionImpactExplanation = createError(ERROR.FORM_FIELD_REQUIRED);
  } else if (values.missionImpactExplanation.length < 250) {
    errors.missionImpactExplanation = createError(ERROR.FORM_FIELD_MIN_LENGTH);
  }

  if (!values.websiteAndSocialLinks) {
    errors.websiteAndSocialLinks = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  if (!values.additionalInfo) {
    errors.additionalInfo = createError(ERROR.FORM_FIELD_REQUIRED);
  }
  return errors;
};

const ApplicationForm = ({ LoggedInUser, loadingLoggedInUser }) => {
  const intl = useIntl();
  const { values, handleSubmit, errors, getFieldProps, setValues, touched, setFieldValue } = useFormik({
    initialValues: {
      location: '',
      name: '',
      email: '',
      initiativeName: '',
      slug: '',
      initiativeDuration: '',
      totalAmountRaised: 0,
      totalAmountToBeRaised: 0,
      expectedFundingPartner: '',
      initiativeDescription: '',
      missionImpactExplanation: '',
      websiteAndSocialLinks: '',
      additionalInfo: '',
      checkedTermsOfServiceOC: false,
      checkedTermsOfServiceOCF: false,
    },
    validate,
    onSubmit: values => {
      console.log(values);
    },
  });

  if (!loadingLoggedInUser && LoggedInUser && !values.name && !values.email) {
    setValues({
      name: LoggedInUser.collective.name,
      email: LoggedInUser.email,
    });
  }

  return (
    <React.Fragment>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
        <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center" mb={[null, 3]}>
          <Box width={'160px'} height={'160px'} mb="24px">
            <Illustration
              alt="OCF Application form illustration"
              src="/static/images/ocf-host-application/ocf-applicationForm-illustration.png"
            />
          </Box>
          <Box textAlign={['center', 'left']} width={['256px', '404px']} mb={4} ml={[null, '24px']}>
            <H1
              fontSize="32px"
              lineHeight="40px"
              letterSpacing="-0.008em"
              color="black.900"
              textAlign={['center', 'left']}
              mb="14px"
            >
              <FormattedMessage id="OCFHostApplication.title" defaultMessage="Apply with your initiative" />
            </H1>
            <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
              <FormattedMessage
                id="OCFHostApplication.applicationForm.description"
                defaultMessage="Grantees and project participants will love the simplicity and accessibility, and you’ll love how much your overhead is reduced."
              />
            </P>
          </Box>
        </Flex>
      </Flex>
      <Flex flexDirection={['column', 'row']} alignItems={['center', 'flex-start']} justifyContent="center">
        <Flex flexDirection="column" alignItems="center" justifyContent="center" as="form" onSubmit={handleSubmit}>
          <Container
            justifyContent="center"
            flexDirection="column"
            alignItems={['center', 'flex-start']}
            mb={4}
            mt={[3, 0]}
            border="1px solid #DCDEE0"
            padding="32px 16px"
            display="flex"
            borderRadius="8px"
            mr={['36px', null, null, null, '102px']}
          >
            <Box width={['256px', '484px', '664px']}>
              <Container display="flex" alignItems="center" justifyContent="space-between">
                <H4 fontSize="16px" lineHeight="24px" color="black.900" mb={2}>
                  <FormattedMessage
                    id="OCFHostApplication.applicationForm.title"
                    defaultMessage="About you and your initiative {padlock} {questionMark}"
                    values={{
                      padlock: <Lock size="12px" color="#9D9FA3" />,
                      questionMark: <Question size="13px" color="#DADADA" />,
                    }}
                  />
                </H4>
                <StyledHr display={['none', 'flex']} width={[null, '219px', '383px']} />
              </Container>
              <P fontSize="12px" lineHeight="16px" color="black.600">
                <FormattedMessage
                  id="OCFHostApplication.applicationForm.instruction"
                  defaultMessage="All fields are mandatory."
                />
              </P>
            </Box>
            <Box width={['256px', '234px', '324px']} my={3}>
              <StyledInputField
                label={intl.formatMessage(messages.locationLabel)}
                labelFontSize="13px"
                labelColor="#4E5052"
                labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                error={touched.location && formatFormErrorMessage(intl, errors.location)}
              >
                {inputProps => (
                  <StyledInput
                    type="text"
                    placeholder="Walnut, CA"
                    {...inputProps}
                    px="7px"
                    {...getFieldProps('location')}
                  />
                )}
              </StyledInputField>
            </Box>
            <Flex flexDirection={['column', 'row']}>
              <Box width={['256px', '234px', '324px']} my={2} mr={[null, 3]}>
                <StyledInputField
                  label={intl.formatMessage(messages.nameLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  disabled={!!LoggedInUser}
                  error={touched.name && formatFormErrorMessage(intl, errors.name)}
                >
                  {inputProps => (
                    <StyledInput
                      type="text"
                      placeholder="Thomas Anderson"
                      px="7px"
                      {...inputProps}
                      {...getFieldProps('name')}
                    />
                  )}
                </StyledInputField>
              </Box>
              <Box width={['256px', '234px', '324px']} my={2}>
                <StyledInputField
                  label={intl.formatMessage(messages.emailLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  disabled={!!LoggedInUser}
                  error={touched.email && formatFormErrorMessage(intl, errors.email)}
                >
                  {inputProps => (
                    <StyledInput
                      type="email"
                      placeholder="tanderson@gmail.com"
                      px="7px"
                      {...inputProps}
                      {...getFieldProps('email')}
                    />
                  )}
                </StyledInputField>
                <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                  <FormattedMessage
                    id="OCFHostApplication.applicationForm.emailInstruction"
                    defaultMessage="We will use this email to create your account."
                  />
                </P>
              </Box>
            </Flex>
            <Flex flexDirection={['column', 'row']}>
              <Box width={['256px', '234px', '324px']} my={2} mr={[null, 3]}>
                <StyledInputField
                  label={intl.formatMessage(messages.initiativeNameLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  error={touched.initiativeName && formatFormErrorMessage(intl, errors.initiativeName)}
                >
                  {inputProps => (
                    <StyledInput
                      type="text"
                      placeholder="Agora Collective"
                      px="7px"
                      {...inputProps}
                      {...getFieldProps('initiativeName')}
                    />
                  )}
                </StyledInputField>
              </Box>
              <Box width={['256px', '234px', '324px']} my={2}>
                <StyledInputField
                  label={intl.formatMessage(messages.slugLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  error={touched.slug && formatFormErrorMessage(intl, errors.slug)}
                >
                  {inputProps => (
                    <StyledInputGroup
                      prepend="opencollective.com/"
                      type="url"
                      placeholder="agora"
                      {...inputProps}
                      px="7px"
                      prependProps={{ color: '#9D9FA3', fontSize: '13px', lineHeight: '16px' }}
                      {...getFieldProps('slug')}
                    />
                  )}
                </StyledInputField>
                <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                  <FormattedMessage
                    id="OCFHostApplication.applicationForm.slugInstruction"
                    defaultMessage="Suggested"
                  />
                </P>
              </Box>
            </Flex>
            <Flex flexDirection={['column', 'row']}>
              <Box width={['256px', '234px', '324px']} my={2} mr={[null, 3]}>
                <StyledInputField
                  label={intl.formatMessage(messages.initiativeDurationLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  error={touched.initiativeDuration && formatFormErrorMessage(intl, errors.initiativeDuration)}
                >
                  {inputProps => (
                    <StyledInput
                      type="text"
                      placeholder="New initiatives are welcome!"
                      {...inputProps}
                      px="7px"
                      {...getFieldProps('initiativeDuration')}
                    />
                  )}
                </StyledInputField>
              </Box>
              <Box width={['256px', '234px', '324px']} my={2}>
                <StyledInputField
                  label={intl.formatMessage(messages.totalAmountRaisedLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  error={touched.totalAmountRaised && formatFormErrorMessage(intl, errors.totalAmountRaised)}
                >
                  {inputProps => (
                    <StyledInputAmount
                      type="text"
                      placeholder="It's fine if you're just starting out."
                      {...inputProps}
                      px="7px"
                      currency="USD"
                      {...getFieldProps('totalAmountRaised')}
                      onChange={value => setFieldValue('totalAmountRaised', value)}
                    />
                  )}
                </StyledInputField>
                <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                  <FormattedMessage
                    id="OCFHostApplication.applicationForm.totalAmountRaisedInstruction"
                    defaultMessage="If you haven't please type 0."
                  />
                </P>
              </Box>
            </Flex>
            <Flex flexDirection={['column', 'row']}>
              <Box width={['256px', '234px', '324px']} my={2} mr={[null, 3]}>
                <StyledInputField
                  label={intl.formatMessage(messages.totalAmountToBeRaisedLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  error={touched.totalAmountToBeRaised && formatFormErrorMessage(intl, errors.totalAmountToBeRaised)}
                >
                  {inputProps => (
                    <StyledInputAmount
                      type="text"
                      placeholder="Be as ambitious as you want."
                      currency="USD"
                      {...inputProps}
                      px="7px"
                      {...getFieldProps('totalAmountToBeRaised')}
                      onChange={value => setFieldValue('totalAmountToBeRaised', value)}
                    />
                  )}
                </StyledInputField>
              </Box>
              <Box width={['256px', '234px', '324px']} my={2}>
                <StyledInputField
                  label={intl.formatMessage(messages.expectedFundingPartnerLabel)}
                  labelFontSize="13px"
                  labelColor="#4E5052"
                  labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                  error={touched.expectedFundingPartner && formatFormErrorMessage(intl, errors.expectedFundingPartner)}
                >
                  {inputProps => (
                    <StyledInput
                      type="text"
                      placeholder="An idea of your ideal partners."
                      {...inputProps}
                      px="7px"
                      {...getFieldProps('expectedFundingPartner')}
                    />
                  )}
                </StyledInputField>
              </Box>
            </Flex>
            <Box width={['256px', '484px', '663px']} my={2}>
              <StyledInputField
                label={intl.formatMessage(messages.initiativeDescriptionLabel)}
                labelFontSize="13px"
                labelColor="#4E5052"
                labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                error={touched.initiativeDescription && formatFormErrorMessage(intl, errors.initiativeDescription)}
              >
                {inputProps => (
                  <StyledTextarea
                    placeholder="We make sandwiches and give them to 
            our neighbors in an outdoor community 
            fridge. We collaborate with other 
            organizations to figure out what the 
            best flavor sandwich is."
                    {...inputProps}
                    {...getFieldProps('initiativeDescription')}
                    px="7px"
                  />
                )}
              </StyledInputField>
              <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                <FormattedMessage
                  id="OCFHostApplication.applicationForm.whatDoesInitiativeDoInstruction"
                  defaultMessage="Write a short description of your organization (250 characters max)"
                />
              </P>
            </Box>
            <Box width={['256px', '484px', '663px']} my={2}>
              <StyledInputField
                label={intl.formatMessage(messages.missionImpactExplanationLabel)}
                labelFontSize="13px"
                labelColor="#4E5052"
                labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                error={
                  touched.missionImpactExplanation && formatFormErrorMessage(intl, errors.missionImpactExplanation)
                }
              >
                {inputProps => (
                  <StyledTextarea
                    placeholder="We create a positive social impact and 
              combat community deterioration by 
              providing access to the best 
              sandwiches to our neighbors and 
              building a strong community around our 
              love of sandwiches."
                    {...inputProps}
                    {...getFieldProps('missionImpactExplanation')}
                    px="7px"
                  />
                )}
              </StyledInputField>
              <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                <FormattedMessage
                  id="OCFHostApplication.applicationForm.missionInstruction"
                  defaultMessage="Check the sidebar for more info (250 characters max)"
                />
              </P>
            </Box>
            <Box width={['256px', '484px', '663px']} my={2}>
              <StyledInputField
                label={intl.formatMessage(messages.websiteAndSocialLinksLabel)}
                labelFontSize="13px"
                labelColor="#4E5052"
                labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                error={touched.websiteAndSocialLinks && formatFormErrorMessage(intl, errors.websiteAndSocialLinks)}
              >
                {inputProps => (
                  <StyledTextarea type="text" {...inputProps} px="7px" {...getFieldProps('websiteAndSocialLinks')} />
                )}
              </StyledInputField>
              <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                <FormattedMessage
                  id="OCFHostApplication.applicationForm.websiteInstruction"
                  defaultMessage="If you have something to send us please upload it to a storage service (Dropbox, Drive) and paste the sharing link here."
                />
              </P>
            </Box>
            <Box width={['256px', '484px', '663px']} my={2}>
              <StyledInputField
                label={intl.formatMessage(messages.additionalInfoLabel)}
                labelFontSize="13px"
                labelColor="#4E5052"
                labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                error={touched.additionalInfo && formatFormErrorMessage(intl, errors.additionalInfo)}
              >
                {inputProps => (
                  <StyledTextarea
                    placeholder="What else do we need to know about 
              your initiative?"
                    {...inputProps}
                    {...getFieldProps('additionalInfo')}
                    px="7px"
                  />
                )}
              </StyledInputField>
            </Box>
            <Box width={['256px', '484px', '663px']} mb={2} mt="40px">
              <StyledHr />
            </Box>
            <Container
              width={['256px', '484px', '663px']}
              display="flex"
              alignSelf="flex-start"
              alignItems="center"
              my={2}
            >
              <Box mr={3}>
                <StyledCheckbox
                  name="TOSAgreement"
                  background="#396C6F"
                  size="16px"
                  {...getFieldProps('checkedTermsOfServiceOC')}
                  checked={values.checkedTermsOfServiceOC}
                />
              </Box>
              <P ml={2} fontSize="12px" lineHeight="16px" fontWeight="400" color="black.800">
                <FormattedMessage
                  id="OCFHostApplication.applicationForm.OCTermsCheckbox"
                  defaultMessage="I agree with the {tosLink} of Open Collective."
                  values={{
                    tosLink: <StyledLink href="#">terms of service</StyledLink>,
                  }}
                />
              </P>
            </Container>
            <Container
              width={['256px', '484px', '663px']}
              display="flex"
              alignSelf="flex-start"
              alignItems="center"
              my={2}
            >
              <Box mr={3}>
                <StyledCheckbox
                  background="#396C6F"
                  size="16px"
                  {...getFieldProps('checkedTermsOfServiceOCF')}
                  checked={values.checkedTermsOfServiceOCF}
                />
              </Box>
              <P ml={2} fontSize="12px" lineHeight="16px" fontWeight="400" color="black.800">
                <FormattedMessage
                  id="OCFHostApplication.applicationForm.OCFTermsCheckbox"
                  defaultMessage="I have read and agree with the {tosLink} of OCF."
                  values={{
                    tosLink: <StyledLink href="#">terms of fiscal sponsorship</StyledLink>,
                  }}
                />
              </P>
            </Container>
          </Container>
          <Flex
            flexDirection={['column', 'row']}
            alignItems="center"
            alignSelf={[null, 'flex-start']}
            justifyContent="center"
            mb="40px"
            mt={[null, 3]}
          >
            <Link route="/ocf/apply/fees">
              <StyledButton mb={[3, 0]} width={['286px', '120px']} mr={[null, 3]}>
                <FormattedMessage
                  id="OCFHostApplication.backBtn"
                  defaultMessage="{arrowLeft} Back"
                  values={{
                    arrowLeft: <ArrowLeft2 size="14px" />,
                  }}
                />
              </StyledButton>
            </Link>
            <OCFPrimaryButton width={['286px', '120px']} type="submit">
              <FormattedMessage
                id="OCFHostApplication.applyBtn"
                defaultMessage="Apply {arrowRight}"
                values={{
                  arrowRight: <ArrowRight2 size="14px" />,
                }}
              />
            </OCFPrimaryButton>
          </Flex>
        </Flex>
        <Flex flexDirection="column" alignItems="center" justifyContent="center">
          <StyledHr width="1px" solid />
          <OCFHostApplicationFAQ width={['256px', '148px', '194px', null, '239px']} />
        </Flex>
      </Flex>
    </React.Fragment>
  );
};

ApplicationForm.propTypes = {
  loadingLoggedInUser: PropTypes.bool,
  LoggedInUser: PropTypes.object,
};

export default ApplicationForm;
