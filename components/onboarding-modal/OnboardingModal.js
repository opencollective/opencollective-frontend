import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Modal, { ModalBody, ModalHeader, ModalFooter } from '../../components/StyledModal';
import OnboardingNavButtons from './OnboardingNavButtons';
import OnboardingStepsProgress from './OnboardingStepsProgress';
import OnboardingContentBox from './OnboardingContentBox';
import MessageBox from '../../components/MessageBox';

import { getErrorFromGraphqlException } from '../../lib/utils';
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
    query: PropTypes.object,
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    EditCollectiveMembers: PropTypes.func,
    EditCollectiveContact: PropTypes.func,
    show: PropTypes.bool,
    setShow: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      step: 0,
      members: [],
      error: null,
    };
  }

  componentDidMount() {
    this.setStep(this.props.query.step);
  }

  componentDidUpdate(oldProps) {
    if (oldProps.query.step !== this.props.query.step) {
      this.setStep(this.props.query.step);
    }
  }

  setStep = queryStep => {
    if (queryStep === undefined) {
      this.setState({ step: 0 });
    } else if (queryStep === 'administrators') {
      this.setState({ step: 1 });
    } else if (queryStep === 'contact') {
      this.setState({ step: 2 });
    }
  };

  addAdmins = members => {
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
      this.setState({ isSubmitting: false, error: getErrorFromGraphqlException(e) });
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
      this.setState({ isSubmitting: false, error: getErrorFromGraphqlException(e) });
    }
  };

  submitCollectiveInfo = async () => {
    await this.submitContact();
    await this.submitAdmins();
    this.props.setShow(false);
    Router.pushRoute('editCollective', { slug: this.props.collective.slug, section: 'info' });
  };

  setParams = (step, param) => {
    return params[step][param];
  };

  render() {
    const { collective, LoggedInUser, show, setShow } = this.props;
    const { step, isSubmitting, error } = this.state;

    return (
      <Modal width="576px" minHeight="456px" show={show} onClose={() => setShow(false)}>
        <ModalHeader onClose={() => setShow(false)}>
          <Flex flexDirection="column" alignItems="center" width="100%">
            <StepsProgressBox ml={'15px'} mb={[3, null, 4]} width={0.8}>
              <OnboardingStepsProgress
                step={step}
                handleStep={step => this.setState({ step })}
                slug={collective.slug}
              />
            </StepsProgressBox>
          </Flex>
        </ModalHeader>
        <ModalBody>
          <Flex flexDirection="column" alignItems="center">
            <img width={'160px'} height={this.setParams(step, 'height')} src={this.setParams(step, 'src')} />
            <OnboardingContentBox
              step={step}
              collective={collective}
              LoggedInUser={LoggedInUser}
              addAdmins={this.addAdmins}
              addContact={this.addContact}
            />
            {error && (
              <MessageBox type="error" withIcon mt={2}>
                {error.replace('GraphQL error: ', 'Error: ')}
              </MessageBox>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex flexDirection="column" alignItems="center">
            <OnboardingNavButtons
              step={step}
              slug={collective.slug}
              submitCollectiveInfo={this.submitCollectiveInfo}
              loading={isSubmitting}
            />
          </Flex>
        </ModalFooter>
      </Modal>
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
