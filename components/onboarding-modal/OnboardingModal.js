import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import StyledHr from '../../components/StyledHr';
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

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

class OnboardingModal extends React.Component {
  static propTypes = {
    query: PropTypes.object,
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    // refetchLoggedInUser: PropTypes.func,
    EditCollectiveMembers: PropTypes.func,
    EditCollectiveContact: PropTypes.func,
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
    Router.pushRoute('editCollective', { slug: this.props.collective.slug, section: 'info' });
  };

  render() {
    const { collective, LoggedInUser } = this.props;
    const { step, isSubmitting, error } = this.state;

    return (
      <Flex flexDirection="column" alignItems="center" py={[0, 4]}>
        <StepsProgressBox mb={[3, null, 4]} width={0.8}>
          <OnboardingStepsProgress step={step} handleStep={step => this.setState({ step })} slug={collective.slug} />
        </StepsProgressBox>
        <Image src="/static/images/create-collective/communityIllustration.png" alt="Welcome!" />
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
        <StyledHr my={4} borderColor="black.300" width="100%" />
        <OnboardingNavButtons
          step={step}
          slug={collective.slug}
          submitCollectiveInfo={this.submitCollectiveInfo}
          loading={isSubmitting}
        />
      </Flex>
    );
  }
}

// GraphQL for editing Collective admins info
const MemberFieldsFragment = gql`
  fragment MemberFieldsFragment on Member {
    id
    role
    member {
      id
      name
    }
  }
`;

const editCoreContributorsQuery = gql`
  mutation EditCollectiveMembers($collectiveId: Int!, $members: [MemberInputType!]!) {
    editCoreContributors(collectiveId: $collectiveId, members: $members) {
      id
      members(roles: ["ADMIN"]) {
        ...MemberFieldsFragment
      }
    }
  }
  ${MemberFieldsFragment}
`;

const addEditCoreContributorsMutation = graphql(editCoreContributorsQuery, {
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
const editCollectiveContactQuery = gql`
  mutation EditCollectiveContact($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      website
      twitterHandle
      githubHandle
    }
  }
`;

const addEditCollectiveContactMutation = graphql(editCollectiveContactQuery, {
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
