import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Form, Formik } from 'formik';
import { map, omit } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { SocialLinkType } from '../../lib/graphql/types/v2/graphql';
import { editCollectiveContactMutation, editCollectiveMembersMutation } from '../../lib/graphql/v1/mutations';
import { compose, isValidUrl } from '../../lib/utils';

import Container from '../../components/Container';
import MessageBox from '../../components/MessageBox';
import StyledButton from '../../components/StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../components/StyledModal';
import { H1, P } from '../../components/Text';

import { Box, Flex } from '../Grid';
import Image from '../Image';

import OnboardingContentBox from './OnboardingContentBox';
import OnboardingNavButtons from './OnboardingNavButtons';
import OnboardingStepsProgress from './OnboardingStepsProgress';

const StepsProgressBox = styled(Box)`
  min-height: 95px;
  max-width: 600px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

const ResponsiveModal = styled(StyledModal)`
  @media screen and (max-width: 40em) {
    transform: translate(0%, 0%);
    position: fixed;
    top: 69px;
    left: 0px;
    height: calc(100vh - 70px);
    background: white;
    max-width: 100%;
    border: none;
    border-radius: 0;
    padding: 0px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
`;

const ResponsiveModalHeader = styled(ModalHeader)`
  @media screen and (max-width: 40em) {
    padding: 0px;
    svg {
      display: none;
    }
  }
`;

const ResponsiveModalBody = styled(ModalBody)`
  @media screen and (max-width: 40em) {
    flex-grow: 1;
  }
`;

const ResponsiveModalFooter = styled(ModalFooter)`
  @media screen and (max-width: 40em) {
    padding-bottom: 20px;
  }
`;

const ModalWithImage = styled(ResponsiveModal)`
  @media screen and (min-width: 40em) {
    background: white url('/static/images/create-collective/onboardingSuccessIllustration.png');
    background-repeat: no-repeat;
    background-size: 100%;
  }
`;
const FormWithStyles = styled(Form)`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const params = {
  0: {
    height: 114,
    src: '/static/images/create-collective/onboardingWelcomeIllustration.png',
  },
  1: {
    height: 112,
    src: '/static/images/create-collective/onboardingAdminsIllustration.png',
  },
  2: {
    height: 119,
    src: '/static/images/create-collective/onboardingContactIllustration.png',
  },
};

class OnboardingModal extends React.Component {
  static propTypes = {
    step: PropTypes.string,
    mode: PropTypes.string,
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    editCollectiveMembers: PropTypes.func,
    editCollectiveContact: PropTypes.func,
    showOnboardingModal: PropTypes.bool,
    data: PropTypes.object,
    setShowOnboardingModal: PropTypes.func,
    intl: PropTypes.object.isRequired,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      step: 0,
      members: [],
      error: null,
    };

    this.messages = defineMessages({
      websiteError: { id: 'onboarding.error.website', defaultMessage: 'Please enter a valid URL.' },
    });
  }

  componentDidMount() {
    this.setStep(this.props.step);
  }

  componentDidUpdate(oldProps) {
    if (oldProps.step !== this.props.step) {
      this.setStep(this.props.step);
    }
  }

  setStep = queryStep => {
    if (queryStep === undefined) {
      this.setState({ step: 0 });
    } else if (queryStep === 'administrators') {
      this.setState({ step: 1 });
    } else if (queryStep === 'contact-info') {
      this.setState({ step: 2 });
    } else if (queryStep === 'success') {
      this.setState({ step: 3 });
    }
  };

  updateAdmins = members => {
    this.setState({ members });
  };

  submitAdmins = async () => {
    try {
      this.setState({ isSubmitting: true });
      await this.props.editCollectiveMembers({
        variables: {
          collectiveId: this.props.collective.id,
          members: this.state.members.map(member => ({
            id: member.id,
            role: member.role,
            member: {
              id: member.member.id,
              name: member.member.name,
            },
          })),
        },
      });
    } catch (e) {
      const errorMsg = getErrorFromGraphqlException(e).message;
      throw new Error(errorMsg);
    }
  };

  submitContact = async values => {
    const collective = {
      ...values,
      id: this.props.collective.id,
    };
    try {
      this.setState({ isSubmitting: true });
      await this.props.editCollectiveContact({ variables: { collective } });
    } catch (e) {
      const errorMsg = getErrorFromGraphqlException(e).message;
      throw new Error(errorMsg);
    }
  };

  submitCollectiveInfo = async values => {
    try {
      await this.submitContact(values);
      await this.submitAdmins();
      this.props.router.push(`/${this.props.collective.slug}/${this.props.mode}/success`).then(() => {
        confettiFireworks(5000, { zIndex: 3000 });
      });
    } catch (e) {
      this.setState({ isSubmitting: false, error: e });
    }
  };

  getStepParams = (step, param) => {
    return params[step][param];
  };

  onClose = () => {
    this.props.setShowOnboardingModal(false);
    this.props.router.push(`/${this.props.collective.slug}`);
  };

  validateFormik = values => {
    const errors = {};

    const isValidSocialLinks = values.socialLinks?.filter(l => !isValidUrl(l.url))?.length === 0;

    if (!isValidSocialLinks) {
      errors.socialLinks = this.props.intl.formatMessage(this.messages.websiteError);
    }

    return errors;
  };

  render() {
    const { collective, LoggedInUser, showOnboardingModal, mode, data } = this.props;
    const { step, isSubmitting, error } = this.state;

    return (
      <React.Fragment>
        {step === 3 ? (
          <React.Fragment>
            {showOnboardingModal && (
              <ModalWithImage usePortal={false} width="576px" minHeight="456px" onClose={this.onClose}>
                <ModalBody>
                  <Flex flexDirection="column" alignItems="center">
                    <Container display="flex" flexDirection="column" alignItems="center">
                      <Box maxWidth="336px">
                        <H1
                          fontSize="40px"
                          lineHeight="44px"
                          fontWeight="bold"
                          color="black.900"
                          textAlign="center"
                          mt={6}
                          mb={4}
                          mx={2}
                          data-cy="welcome-collective"
                        >
                          <FormattedMessage
                            id="onboarding.success.header"
                            defaultMessage="Welcome to your new Collective!"
                          />
                        </H1>
                      </Box>
                      <Box maxWidth="450px">
                        <P fontSize="16px" lineHeight="24px" color="black.900" textAlign="center" mb={4} mx={2}>
                          <FormattedMessage
                            id="onboarding.success.text"
                            defaultMessage="You're all set! Customize the look, start accepting contributions, and interact with your community."
                          />
                        </P>
                      </Box>
                    </Container>
                  </Flex>
                </ModalBody>
                <ResponsiveModalFooter>
                  <Flex flexDirection="column" alignItems="center">
                    <StyledButton buttonStyle="primary" onClick={this.onClose} data-cy="close-button">
                      <FormattedMessage id="Close" defaultMessage="Close" />
                    </StyledButton>
                  </Flex>
                </ResponsiveModalFooter>
              </ModalWithImage>
            )}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {showOnboardingModal && (
              <ResponsiveModal usePortal={false} width="576px" minHeight="456px" onClose={this.onClose} trapFocus>
                <ResponsiveModalHeader onClose={this.onClose}>
                  <Flex flexDirection="column" alignItems="center" width="100%">
                    <StepsProgressBox ml={[0, '15px']} mb={[3, null, 4]} width={[1.0, 0.8]}>
                      <OnboardingStepsProgress
                        step={step}
                        mode={mode}
                        handleStep={step => this.setState({ step })}
                        slug={collective.slug}
                      />
                    </StepsProgressBox>
                  </Flex>
                </ResponsiveModalHeader>
                <Formik
                  validate={this.validateFormik}
                  validateOnBlur={true}
                  initialValues={{
                    socialLinks:
                      collective.socialLinks?.length !== 0
                        ? map(collective.socialLinks, sl => omit(sl, '__typename'))
                        : [
                            {
                              type: SocialLinkType.WEBSITE,
                              url: '',
                            },
                          ],
                  }}
                  onSubmit={values => {
                    this.submitCollectiveInfo(values);
                  }}
                >
                  {({ values, handleSubmit, errors, touched, setFieldValue, setFieldTouched }) => (
                    <FormWithStyles>
                      <ResponsiveModalBody>
                        <Flex flexDirection="column" alignItems="center">
                          <Image
                            alt="OnBoarding"
                            width={160}
                            height={this.getStepParams(step, 'height')}
                            src={this.getStepParams(step, 'src')}
                          />
                          <OnboardingContentBox
                            slug={collective.slug}
                            step={step}
                            collective={collective}
                            LoggedInUser={LoggedInUser}
                            updateAdmins={this.updateAdmins}
                            values={values}
                            errors={errors}
                            touched={touched}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            memberInvitations={data?.memberInvitations || []}
                          />
                          {error && (
                            <MessageBox type="error" withIcon mt={2}>
                              {error.message}
                            </MessageBox>
                          )}
                        </Flex>
                      </ResponsiveModalBody>
                      <ResponsiveModalFooter>
                        <Flex flexDirection="column" alignItems="center">
                          <OnboardingNavButtons
                            step={step}
                            mode={mode}
                            slug={collective.slug}
                            loading={isSubmitting}
                            handleSubmit={handleSubmit}
                          />
                        </Flex>
                      </ResponsiveModalFooter>
                    </FormWithStyles>
                  )}
                </Formik>
              </ResponsiveModal>
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

export const addEditCollectiveMembersMutation = graphql(editCollectiveMembersMutation, {
  name: 'editCollectiveMembers',
});

const addEditCollectiveContactMutation = graphql(editCollectiveContactMutation, {
  name: 'editCollectiveContact',
});

const addMemberInvitationQuery = graphql(
  gql`
    query MemberInvitations($slug: String!) {
      memberInvitations(account: { slug: $slug }, role: [ADMIN]) {
        id
        role
        memberAccount {
          id
          name
          imageUrl
          slug
        }
      }
    }
  `,
  {
    options: props => ({
      variables: { slug: props.collective.slug },
      context: API_V2_CONTEXT,
    }),
  },
);

const addGraphql = compose(
  addEditCollectiveMembersMutation,
  addEditCollectiveContactMutation,
  addMemberInvitationQuery,
);

export default injectIntl(addGraphql(withRouter(OnboardingModal)));
