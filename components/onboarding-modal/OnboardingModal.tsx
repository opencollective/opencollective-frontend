import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { Form, Formik } from 'formik';
import { map, omit } from 'lodash-es';
import type { Router } from 'next/router';
import { withRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V1_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { SocialLink, SocialLinkInput } from '../../lib/graphql/types/v2/graphql';
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

const messages = defineMessages({
  websiteError: { id: 'onboarding.error.website', defaultMessage: 'Please enter a valid URL.' },
});

type OnboardingCollective = {
  id: number;
  slug: string;
  name?: string;
  socialLinks?: SocialLink[];
};

type OnboardingMember = {
  id: number;
  role?: string;
  member: { id: number; name?: string; imageUrl?: string; slug?: string };
};

type OnboardingMemberInvitation = {
  id: number;
  role?: string;
  memberAccount: { id: number; name?: string; imageUrl?: string; slug?: string };
};

type OnboardingFormValues = {
  socialLinks?: SocialLinkInput[];
};

type OnboardingModalProps = {
  step?: string;
  mode?: string;
  collective: OnboardingCollective;
  LoggedInUser?: {
    collective: OnboardingMember['member'];
    memberOf?: Array<{ id: number; role?: string; collective: { id: number } }>;
  };
  editCollectiveMembers?: (options: {
    variables: {
      collectiveId: number;
      members: Array<{ id: number; role?: string; member: OnboardingMember['member'] }>;
    };
  }) => Promise<unknown>;
  editCollectiveContact?: (options: {
    variables: { collective: OnboardingFormValues & { id: number } };
  }) => Promise<unknown>;
  showOnboardingModal?: boolean;
  data?: { memberInvitations?: OnboardingMemberInvitation[] };
  setShowOnboardingModal?: (show: boolean) => void;
  /** @ignore from injectIntl */
  intl?: IntlShape;
  router: Router;
};

type OnboardingModalState = {
  step: number;
  members: OnboardingMember[];
  error: Error | null;
  isSubmitting?: boolean;
};

class OnboardingModal extends React.Component<OnboardingModalProps, OnboardingModalState> {
  constructor(props: OnboardingModalProps) {
    super(props);

    this.state = {
      step: 0,
      members: [],
      error: null,
    };
  }

  componentDidMount() {
    this.setStep(this.props.step);
  }

  componentDidUpdate(oldProps: OnboardingModalProps) {
    if (oldProps.step !== this.props.step) {
      this.setStep(this.props.step);
    }
  }

  setStep = (queryStep?: string) => {
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

  updateAdmins = (members: OnboardingMember[]) => {
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
      throw new Error(errorMsg, { cause: e });
    }
  };

  submitContact = async (values: OnboardingFormValues) => {
    const collective = {
      ...values,
      id: this.props.collective.id,
    };
    try {
      this.setState({ isSubmitting: true });
      await this.props.editCollectiveContact({ variables: { collective } });
    } catch (e) {
      const errorMsg = getErrorFromGraphqlException(e).message;
      throw new Error(errorMsg, { cause: e });
    }
  };

  submitCollectiveInfo = async (values: OnboardingFormValues) => {
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

  getStepParams = (step: number, param: 'height' | 'src') => {
    return params[step][param];
  };

  onClose = () => {
    this.props.setShowOnboardingModal(false);
    this.props.router.push(`/${this.props.collective.slug}`);
  };

  validateFormik = (values: OnboardingFormValues) => {
    const errors: { socialLinks?: string } = {};

    const isValidSocialLinks = values.socialLinks?.filter(l => !isValidUrl(l.url))?.length === 0;

    if (!isValidSocialLinks) {
      errors.socialLinks = this.props.intl.formatMessage(messages.websiteError);
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
              // `usePortal`/`minHeight` are legacy props that `StyledModal` no longer declares (see PLAN.md findings)
              <ModalWithImage
                {...({ usePortal: false, minHeight: '456px' } as Record<string, unknown>)}
                width="576px"
                onClose={this.onClose}
              >
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
              // `usePortal`/`minHeight`/`trapFocus` are legacy props that `StyledModal` no longer declares (see PLAN.md)
              <ResponsiveModal
                {...({ usePortal: false, minHeight: '456px', trapFocus: true } as Record<string, unknown>)}
                width="576px"
                onClose={this.onClose}
              >
                <ResponsiveModalHeader onClose={this.onClose}>
                  <Flex flexDirection="column" alignItems="center" width="100%">
                    <StepsProgressBox ml={[0, '15px']} mb={[3, null, 4]} width={[1.0, 0.8]}>
                      {/* `handleStep` is not a prop of `OnboardingStepsProgress` (dead prop, see PLAN.md findings) */}
                      <OnboardingStepsProgress
                        {...({ handleStep: (step: number) => this.setState({ step }) } as Record<string, unknown>)}
                        step={step}
                        mode={mode}
                        slug={collective.slug}
                      />
                    </StepsProgressBox>
                  </Flex>
                </ResponsiveModalHeader>
                <Formik
                  validate={this.validateFormik}
                  validateOnBlur={true}
                  initialValues={{
                    socialLinks: map(collective.socialLinks, sl => omit(sl, '__typename')),
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

const addEditCollectiveMembersMutation = graphql(editCollectiveMembersMutation, {
  name: 'editCollectiveMembers',
  options: {
    context: API_V1_CONTEXT,
  },
});

const addEditCollectiveContactMutation = graphql(editCollectiveContactMutation, {
  name: 'editCollectiveContact',
  options: {
    context: API_V1_CONTEXT,
  },
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
    options: (props: { collective: { slug?: string } }) => ({
      variables: { slug: props.collective.slug },
    }),
  },
);

const addGraphql = compose(
  addEditCollectiveMembersMutation,
  addEditCollectiveContactMutation,
  addMemberInvitationQuery,
);

export default addGraphql(withRouter(OnboardingModal));
