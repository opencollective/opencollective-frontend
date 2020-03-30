import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';
import confetti from 'canvas-confetti';

import Modal, { ModalBody, ModalHeader, ModalFooter, ModalOverlay } from '../../components/StyledModal';
import OnboardingNavButtons from './OnboardingNavButtons';
import OnboardingStepsProgress from './OnboardingStepsProgress';
import OnboardingContentBox from './OnboardingContentBox';
import MessageBox from '../../components/MessageBox';
import Container from '../../components/Container';
import { H1, P } from '../../components/Text';
import StyledButton from '../../components/StyledButton';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { getLoggedInUserQuery } from '../../lib/graphql/queries';
import { Router } from '../../server/pages';

const StepsProgressBox = styled(Box)`
  min-height: 95px;
  max-width: 600px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

const ResponsiveModal = styled(Modal)`
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

const ResponsiveModalFooter = styled(ModalFooter)`
  @media screen and (max-width: 40em) {
    padding-bottom: 20px;
  }
`;

const ResponsiveModalOverlay = styled(ModalOverlay)`
  ${overlay =>
    overlay.noOverlay &&
    css`
      display: none;
    `}
  @media screen and (max-width: 40em) {
    display: none;
  }
`;

const ModalWithImage = styled(ResponsiveModal)`
  @media screen and (min-width: 40em) {
    background: white url('/static/images/create-collective/original/onboardingSuccessIllustration.png');
    background-repeat: no-repeat;
    background-size: 100%;
  }
`;

const params = {
  0: {
    height: '114px',
    src: '/static/images/create-collective/onboardingWelcomeIllustration.png',
  },
  1: {
    height: '112px',
    src: '/static/images/create-collective/onboardingAdminsIllustration.png',
  },
  2: {
    height: '119px',
    src: '/static/images/create-collective/onboardingContactIllustration.png',
  },
};

class OnboardingModal extends React.Component {
  static propTypes = {
    step: PropTypes.string,
    mode: PropTypes.string,
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    EditCollectiveMembers: PropTypes.func,
    EditCollectiveContact: PropTypes.func,
    showOnboardingModal: PropTypes.bool,
    setShowOnboardingModal: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      step: 0,
      members: [],
      error: null,
      noOverlay: false,
    };
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
    } else if (queryStep === 'contact') {
      this.setState({ step: 2 });
    } else if (queryStep === 'success') {
      this.setState({ step: 3 });
    }
  };

  updateAdmins = members => {
    this.setState({ members });
  };

  addContact = (name, value) => {
    this.setState(state => ({
      collective: {
        ...state.collective,
        [name]: value,
      },
    }));
  };

  submitAdmins = async () => {
    try {
      this.setState({ isSubmitting: true });
      await this.props.EditCollectiveMembers({
        collectiveId: this.props.collective.id,
        members: this.state.members.map(member => ({
          id: member.id,
          role: member.role,
          member: {
            id: member.member.id,
            name: member.member.name,
          },
        })),
      });
    } catch (e) {
      const errorMsg = getErrorFromGraphqlException(e).message;
      throw new Error(errorMsg);
    }
  };

  submitContact = async () => {
    const collective = {
      ...this.state.collective,
      id: this.props.collective.id,
    };
    try {
      this.setState({ isSubmitting: true });
      await this.props.EditCollectiveContact({
        collective,
      });
    } catch (e) {
      const errorMsg = getErrorFromGraphqlException(e).message;
      throw new Error(errorMsg);
    }
  };

  submitCollectiveInfo = async () => {
    try {
      await this.submitContact();
      await this.submitAdmins();
      Router.pushRoute('collective-with-onboarding', {
        mode: this.props.mode,
        slug: this.props.collective.slug,
        step: 'success',
      }).then(() => this.confetti());
    } catch (e) {
      this.setState({ isSubmitting: false, error: e });
    }
  };

  getStepParams = (step, param) => {
    return params[step][param];
  };

  onClose = () => {
    this.setState({ noOverlay: true });
    this.props.setShowOnboardingModal(false);
    Router.pushRoute('collective', { slug: this.props.collective.slug });
  };

  confetti = () => {
    const durationInSeconds = 5 * 1000;
    const animationEnd = Date.now() + durationInSeconds;
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const confettisParams = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      } else {
        const particleCount = 50 * (timeLeft / durationInSeconds);
        confetti({ ...confettisParams, particleCount, origin: { x: randomInRange(0, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...confettisParams, particleCount, origin: { x: randomInRange(0.7, 1), y: Math.random() - 0.2 } });
      }
    }, 250);
  };

  render() {
    const { collective, LoggedInUser, showOnboardingModal, mode } = this.props;
    const { step, isSubmitting, error, noOverlay } = this.state;

    return (
      <React.Fragment>
        {step === 3 ? (
          <React.Fragment>
            <ModalWithImage
              usePortal={false}
              width="576px"
              minHeight="456px"
              onClose={this.onClose}
              show={showOnboardingModal}
            >
              <ModalBody>
                <Flex flexDirection="column" alignItems="center">
                  <Container display="flex" flexDirection="column" alignItems="center">
                    <Box maxWidth={['336px']}>
                      <H1
                        fontSize={['H2']}
                        lineHeight={['H2']}
                        fontWeight="bold"
                        color="black.900"
                        textAlign="center"
                        mt={[6]}
                        mb={[4]}
                        mx={[2, null]}
                      >
                        <FormattedMessage
                          id="onboarding.success.header"
                          defaultMessage="Welcome to your new Collective!"
                        />
                      </H1>
                    </Box>
                    <Box maxWidth={['450px']}>
                      <P
                        fontSize={['LeadParagraph']}
                        lineHeight={['LeadParagraph']}
                        color="black.900"
                        textAlign="center"
                        mb={[4]}
                        mx={[2, null]}
                      >
                        <FormattedMessage
                          id="onboarding.success.text"
                          defaultMessage="You're all set! Now you can make this space your own by customizing the look, start
                        accepting contributions, and interacting with your community."
                        />
                      </P>
                    </Box>
                  </Container>
                </Flex>
              </ModalBody>
              <ResponsiveModalFooter>
                <Flex flexDirection="column" alignItems="center">
                  <StyledButton buttonStyle="primary" onClick={this.onClose}>
                    <FormattedMessage id="Close" defaultMessage="Close" />
                  </StyledButton>
                </Flex>
              </ResponsiveModalFooter>
            </ModalWithImage>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <ResponsiveModal
              usePortal={false}
              width="576px"
              minHeight="456px"
              onClose={this.onClose}
              show={showOnboardingModal}
            >
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
              <ModalBody>
                <Flex flexDirection="column" alignItems="center">
                  <img
                    width={'160px'}
                    height={this.getStepParams(step, 'height')}
                    src={this.getStepParams(step, 'src')}
                  />
                  <OnboardingContentBox
                    step={step}
                    collective={collective}
                    LoggedInUser={LoggedInUser}
                    updateAdmins={this.updateAdmins}
                    addContact={this.addContact}
                  />
                  {error && (
                    <MessageBox type="error" withIcon mt={2}>
                      {error.message}
                    </MessageBox>
                  )}
                </Flex>
              </ModalBody>
              <ResponsiveModalFooter>
                <Flex flexDirection="column" alignItems="center">
                  <OnboardingNavButtons
                    step={step}
                    mode={mode}
                    slug={collective.slug}
                    submitCollectiveInfo={this.submitCollectiveInfo}
                    loading={isSubmitting}
                  />
                </Flex>
              </ResponsiveModalFooter>
            </ResponsiveModal>
          </React.Fragment>
        )}
        <ResponsiveModalOverlay onClick={this.onClose} noOverlay={noOverlay} />
      </React.Fragment>
    );
  }
}

// GraphQL for editing Collective admins info
const editCoreContributorsMutation = gql`
  mutation EditCollectiveMembers($collectiveId: Int!, $members: [MemberInputType!]!) {
    editCoreContributors(collectiveId: $collectiveId, members: $members) {
      id
      members(roles: ["ADMIN"]) {
        id
        role
        member {
          id
          name
        }
      }
    }
  }
`;

const addEditCoreContributorsMutation = graphql(editCoreContributorsMutation, {
  props: ({ mutate }) => ({
    EditCollectiveMembers: async ({ collectiveId, members }) => {
      return await mutate({
        variables: { collectiveId, members },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

// GraphQL for editing Collective contact info
const editCollectiveContactMutation = gql`
  mutation EditCollectiveContact($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      website
      twitterHandle
      githubHandle
    }
  }
`;

const addEditCollectiveContactMutation = graphql(editCollectiveContactMutation, {
  props: ({ mutate }) => ({
    EditCollectiveContact: async ({ collective }) => {
      return await mutate({
        variables: { collective },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

export default addEditCollectiveContactMutation(addEditCoreContributorsMutation(OnboardingModal));
