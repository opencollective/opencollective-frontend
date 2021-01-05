import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Lock } from '@styled-icons/boxicons-solid/Lock';
import { ArrowLeft2 } from '@styled-icons/icomoon/ArrowLeft2';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { Question } from '@styled-icons/remix-line/Question';
import { Form, Formik } from 'formik';
import { pick } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { suggestSlug } from '../../lib/collective.lib';
import { OPENCOLLECTIVE_FOUNDATION_ID } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { requireFields, verifyChecked, verifyFieldLength } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import Container from '../Container';
import OCFHostApplicationFAQ from '../faqs/OCFHostApplicationFAQ';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledLink from '../StyledLink';
import StyledTextarea from '../StyledTextarea';
import { H1, H4, P } from '../Text';

import OCFPrimaryButton from './OCFPrimaryButton';

const createCollectiveMutation = gqlV2/* GraphQL */ `
  mutation CreateCollective(
    $collective: CollectiveCreateInput!
    $host: AccountReferenceInput
    $user: UserCreateInput
    $message: String
  ) {
    createCollective(collective: $collective, host: $host, user: $user, message: $message) {
      id
      slug
      host {
        id
        slug
      }
    }
  }
`;

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

const initialValues = {
  location: '',
  name: '',
  email: '',
  initiativeName: '',
  slug: '',
  initiativeDuration: '',
  totalAmountRaised: '',
  totalAmountToBeRaised: '',
  expectedFundingPartner: '',
  initiativeDescription: '',
  missionImpactExplanation: '',
  websiteAndSocialLinks: '',
  additionalInfo: '',
  termsOfServiceOC: false,
  termsOfServiceOCF: false,
};

const ApplicationForm = ({ LoggedInUser, loadingLoggedInUser }) => {
  const intl = useIntl();
  const [createCollective, { loading: submitting, error }] = useMutation(createCollectiveMutation, {
    context: API_V2_CONTEXT,
  });

  const validate = values => {
    const errors = requireFields(values, [
      'location',
      'name',
      'email',
      'initiativeName',
      'slug',
      'initiativeDuration',
      'totalAmountRaised',
      'totalAmountToBeRaised',
      'expectedFundingPartner',
      'initiativeDescription',
      'missionImpactExplanation',
      'websiteAndSocialLinks',
      'additionalInfo',
    ]);

    verifyFieldLength(intl, errors, values, 'name', 1, 50);
    verifyFieldLength(intl, errors, values, 'slug', 1, 30);
    verifyFieldLength(intl, errors, values, 'initiativeDescription', 1, 250);
    verifyFieldLength(intl, errors, values, 'missionImpactExplanation', 1, 250);

    verifyChecked(errors, values, 'termsOfServiceOCF');
    verifyChecked(errors, values, 'termsOfServiceOC');

    return errors;
  };
  const submit = async values => {
    const variables = {
      collective: {
        name: values.initiativeName,
        slug: values.slug,
        description: values.initiativeDescription,
        data: pick(
          values,
          'initiativeDuration',
          'totalAmountRaised',
          'totalAmountToBeRaised',
          'expectedFundingPartner',
          'initiativeDescription',
          'missionImpactExplanation',
          'websiteAndSocialLinks',
          'additionalInfo',
          'location',
        ),
      },
      host: { legacyId: OPENCOLLECTIVE_FOUNDATION_ID },
      user: pick(values, 'name', 'email'),
    };
    const response = await createCollective({ variables });
    if (response.data.createCollective) {
      await Router.pushRoute('/ocf/apply/success');
    }
  };

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
        <Flex flexDirection="column" alignItems="center" justifyContent="center">
          {error && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon mb={[1, 3]}>
                {i18nGraphqlException(intl, error)}
              </MessageBox>
            </Flex>
          )}
          <Formik initialValues={initialValues} onSubmit={submit} validate={validate}>
            {formik => {
              const { values, touched, setFieldValue, setValues, handleSubmit } = formik;

              const handleSlugChange = e => {
                if (!touched.slug) {
                  setFieldValue('slug', suggestSlug(e.target.value));
                }
              };

              if (!loadingLoggedInUser && LoggedInUser && !values.name && !values.email) {
                setValues({
                  ...values,
                  name: LoggedInUser.collective.name,
                  email: LoggedInUser.email,
                });
              }

              return (
                <Form>
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
                    <Box width={['256px', '234px', '324px']}>
                      <StyledInputFormikField
                        label={intl.formatMessage(messages.locationLabel)}
                        labelFontSize="13px"
                        labelColor="#4E5052"
                        labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                        required
                        htmlFor="location"
                        name="location"
                        my={3}
                      >
                        {({ field }) => <StyledInput {...field} type="text" placeholder="Walnut, CA" px="7px" />}
                      </StyledInputFormikField>
                    </Box>
                    <Flex flexDirection={['column', 'row']}>
                      <Box mr={[null, 3]}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.nameLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          disabled={!!LoggedInUser}
                          name="name"
                          htmlFor="name"
                          width={['256px', '234px', '324px']}
                          my={2}
                          required
                        >
                          {({ field }) => <StyledInput type="text" placeholder="Thomas Anderson" px="7px" {...field} />}
                        </StyledInputFormikField>
                      </Box>
                      <Box my={2}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.emailLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          disabled={!!LoggedInUser}
                          name="email"
                          htmlFor="email"
                          width={['256px', '234px', '324px']}
                          required
                        >
                          {({ field }) => (
                            <StyledInput type="email" placeholder="tanderson@gmail.com" px="7px" {...field} />
                          )}
                        </StyledInputFormikField>
                        <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                          <FormattedMessage
                            id="OCFHostApplication.applicationForm.emailInstruction"
                            defaultMessage="We will use this email to create your account."
                          />
                        </P>
                      </Box>
                    </Flex>
                    <Flex flexDirection={['column', 'row']}>
                      <Box my={2} mr={[null, 3]}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.initiativeNameLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="initiativeName"
                          htmlFor="initiativeName"
                          required
                          onChange={handleSlugChange}
                          width={['256px', '234px', '324px']}
                        >
                          {({ field }) => (
                            <StyledInput type="text" placeholder="Agora Collective" px="7px" {...field} />
                          )}
                        </StyledInputFormikField>
                      </Box>
                      <Box width={['256px', '234px', '324px']} my={2}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.slugLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="slug"
                          htmlFor="slug"
                          required
                        >
                          {({ field }) => (
                            <StyledInputGroup
                              prepend="opencollective.com/"
                              type="url"
                              placeholder="agora"
                              {...field}
                              onChange={e => setFieldValue('slug', e.target.value)}
                              px="7px"
                              prependProps={{ color: '#9D9FA3', fontSize: '13px', lineHeight: '16px' }}
                            />
                          )}
                        </StyledInputFormikField>
                        <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                          <FormattedMessage
                            id="OCFHostApplication.applicationForm.slugInstruction"
                            defaultMessage="Suggested"
                          />
                        </P>
                      </Box>
                    </Flex>
                    <Flex flexDirection={['column', 'row']}>
                      <Box mr={[null, 3]}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.initiativeDurationLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="initiativeDuration"
                          htmlFor="initiativeDuration"
                          required
                          width={['256px', '234px', '324px']}
                          my={2}
                        >
                          {({ field }) => (
                            <StyledInput type="text" placeholder="New initiatives are welcome!" {...field} px="7px" />
                          )}
                        </StyledInputFormikField>
                      </Box>
                      <Box width={['256px', '234px', '324px']} my={2}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.totalAmountRaisedLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="totalAmountRaised"
                          htmlFor="totalAmountRaised"
                          required
                        >
                          {({ form, field }) => (
                            <StyledInputAmount
                              id={field.id}
                              currency="USD"
                              px="7px"
                              placeholder="It's fine if you're just starting out."
                              error={field.error}
                              value={field.value}
                              maxWidth="100%"
                              onChange={value => form.setFieldValue(field.name, value)}
                              onBlur={() => form.setFieldTouched(field.name, true)}
                            />
                          )}
                        </StyledInputFormikField>
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
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.totalAmountToBeRaisedLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="totalAmountToBeRaised"
                          htmlFor="totalAmountToBeRaised"
                          required
                        >
                          {({ field, form }) => (
                            <StyledInputAmount
                              id={field.id}
                              placeholder="Be as ambitious as you want."
                              currency="USD"
                              px="7px"
                              error={field.error}
                              value={field.value}
                              maxWidth="100%"
                              onChange={value => form.setFieldValue(field.name, value)}
                              onBlur={() => form.setFieldTouched(field.name, true)}
                            />
                          )}
                        </StyledInputFormikField>
                      </Box>
                      <Box width={['256px', '234px', '324px']} my={2}>
                        <StyledInputFormikField
                          label={intl.formatMessage(messages.expectedFundingPartnerLabel)}
                          labelFontSize="13px"
                          labelColor="#4E5052"
                          labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                          name="expectedFundingPartner"
                          htmlFor="expectedFundingPartner"
                          required
                        >
                          {({ field }) => (
                            <StyledInput
                              type="text"
                              placeholder="An idea of your ideal partners."
                              {...field}
                              px="7px"
                            />
                          )}
                        </StyledInputFormikField>
                      </Box>
                    </Flex>
                    <Box width={['256px', '484px', '663px']} my={2}>
                      <StyledInputFormikField
                        label={intl.formatMessage(messages.initiativeDescriptionLabel)}
                        labelFontSize="13px"
                        labelColor="#4E5052"
                        labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                        name="initiativeDescription"
                        htmlFor="initiativeDescription"
                        required
                      >
                        {({ field }) => (
                          <StyledTextarea
                            placeholder="We make sandwiches and give them to 
            our neighbors in an outdoor community 
            fridge. We collaborate with other 
            organizations to figure out what the 
            best flavor sandwich is."
                            {...field}
                            px="7px"
                          />
                        )}
                      </StyledInputFormikField>
                      <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                        <FormattedMessage
                          id="OCFHostApplication.applicationForm.whatDoesInitiativeDoInstruction"
                          defaultMessage="Write a short description of your organization (250 characters max)"
                        />
                      </P>
                    </Box>
                    <Box width={['256px', '484px', '663px']} my={2}>
                      <StyledInputFormikField
                        label={intl.formatMessage(messages.missionImpactExplanationLabel)}
                        labelFontSize="13px"
                        labelColor="#4E5052"
                        labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                        name="missionImpactExplanation"
                        htmlFor="missionImpactExplanation"
                        required
                      >
                        {({ field }) => (
                          <StyledTextarea
                            placeholder="We create a positive social impact and 
              combat community deterioration by 
              providing access to the best 
              sandwiches to our neighbors and 
              building a strong community around our 
              love of sandwiches."
                            {...field}
                            px="7px"
                          />
                        )}
                      </StyledInputFormikField>
                      <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                        <FormattedMessage
                          id="OCFHostApplication.applicationForm.missionInstruction"
                          defaultMessage="Check the sidebar for more info (250 characters max)"
                        />
                      </P>
                    </Box>
                    <Box width={['256px', '484px', '663px']} my={2}>
                      <StyledInputFormikField
                        label={intl.formatMessage(messages.websiteAndSocialLinksLabel)}
                        labelFontSize="13px"
                        labelColor="#4E5052"
                        labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                        name="websiteAndSocialLinks"
                        htmlFor="websiteAndSocialLinks"
                        required
                      >
                        {({ field }) => <StyledTextarea type="text" {...field} px="7px" />}
                      </StyledInputFormikField>
                      <P fontSize="11px" lineHeight="16px" color="black.600" mt="6px">
                        <FormattedMessage
                          id="OCFHostApplication.applicationForm.websiteInstruction"
                          defaultMessage="If you have something to send us please upload it to a storage service (Dropbox, Drive) and paste the sharing link here."
                        />
                      </P>
                    </Box>
                    <Box width={['256px', '484px', '663px']} my={2}>
                      <StyledInputFormikField
                        label={intl.formatMessage(messages.additionalInfoLabel)}
                        labelFontSize="13px"
                        labelColor="#4E5052"
                        labelProps={{ fontWeight: '600', lineHeight: '16px' }}
                        name="additionalInfo"
                        htmlFor="additionalInfo"
                        required
                      >
                        {({ field }) => (
                          <StyledTextarea
                            placeholder="What else do we need to know about 
              your initiative?"
                            {...field}
                            px="7px"
                          />
                        )}
                      </StyledInputFormikField>
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
                        <StyledInputFormikField name="termsOfServiceOC" required>
                          {({ field }) => (
                            <StyledCheckbox
                              background="#396C6F"
                              size="16px"
                              name={field.name}
                              required={field.required}
                              checked={field.value}
                              onChange={({ checked }) => setFieldValue(field.name, checked)}
                              error={field.error}
                              label={
                                <P ml={1} fontSize="12px" lineHeight="16px" fontWeight="400" color="black.800">
                                  <FormattedMessage
                                    id="OCFHostApplication.applicationForm.OCTermsCheckbox"
                                    defaultMessage="I agree with the {tosLink} of Open Collective."
                                    values={{
                                      tosLink: <StyledLink href="#">terms of service</StyledLink>,
                                    }}
                                  />
                                </P>
                              }
                            />
                          )}
                        </StyledInputFormikField>
                      </Box>
                    </Container>
                    <Container
                      width={['256px', '484px', '663px']}
                      display="flex"
                      alignSelf="flex-start"
                      alignItems="center"
                      my={2}
                    >
                      <Box mr={3}>
                        <StyledInputFormikField name="termsOfServiceOCF" required>
                          {({ field }) => (
                            <StyledCheckbox
                              background="#396C6F"
                              size="16px"
                              name={field.name}
                              required={field.required}
                              checked={field.value}
                              onChange={({ checked }) => setFieldValue(field.name, checked)}
                              error={field.error}
                              label={
                                <P ml={1} fontSize="12px" lineHeight="16px" fontWeight="400" color="black.800">
                                  <FormattedMessage
                                    id="OCFHostApplication.applicationForm.OCFTermsCheckbox"
                                    defaultMessage="I have read and agree with the {tosLink} of OCF."
                                    values={{
                                      tosLink: <StyledLink href="#">terms of fiscal sponsorship</StyledLink>,
                                    }}
                                  />
                                </P>
                              }
                            />
                          )}
                        </StyledInputFormikField>
                      </Box>
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
                    <OCFPrimaryButton
                      width={['286px', '120px']}
                      type="submit"
                      onSubmit={handleSubmit}
                      loading={submitting}
                    >
                      <FormattedMessage
                        id="OCFHostApplication.applyBtn"
                        defaultMessage="Apply {arrowRight}"
                        values={{
                          arrowRight: <ArrowRight2 size="14px" />,
                        }}
                      />
                    </OCFPrimaryButton>
                  </Flex>
                </Form>
              );
            }}
          </Formik>
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
