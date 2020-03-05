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

import { getErrorFromGraphqlException } from '../../lib/utils';
import { getLoggedInUserQuery } from '../../lib/graphql/queries';

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
    EditCollectiveMembers: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      step: 0,
      members: [],
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

  submitAdmins = async () => {
    const now = new Date();
    try {
      this.setState({ isSubmitting: true, error: null });
      const res = await this.props.EditCollectiveMembers({
        collectiveId: this.props.collective.id,
        members: this.state.members.map(member => ({
          id: member.id,
          description: member.description,
          role: member.role,
          since: now,
          member: {
            id: member.member.id,
            name: member.member.name,
            email: member.member.email,
          },
        })),
      });
      const response = res.data;
      await this.props.refetchLoggedInUser();
      console.log(response);
    } catch (e) {
      this.setState({ isSubmitting: false, error: getErrorFromGraphqlException(e) });
    }
  };

  addAdmins = members => {
    this.setState({ members });
  };

  render() {
    const { collective, LoggedInUser } = this.props;
    const { step } = this.state;

    return (
      <Flex flexDirection="column" alignItems="center" py={[4]}>
        <StepsProgressBox mb={[3, null, 4]} width={0.8}>
          <OnboardingStepsProgress step={step} handleStep={step => this.setState({ step })} slug={collective.slug} />
        </StepsProgressBox>
        <Image src="/static/images/createcollective-anycommunity.png" alt="Welcome!" />
        <OnboardingContentBox
          step={step}
          collective={collective}
          adminUser={LoggedInUser.collective}
          addAdmins={this.addAdmins}
        />
        <StyledHr my={4} borderColor="black.300" width="100%" />
        <OnboardingNavButtons step={step} slug={collective.slug} submitAdmins={this.submitAdmins} />
      </Flex>
    );
  }
}

const MemberFieldsFragment = gql`
  fragment MemberFieldsFragment on Member {
    id
    role
    since
    createdAt
    description
    member {
      id
      name
      slug
      type
      imageUrl(height: 64)
      ... on User {
        email
      }
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

export default addEditCoreContributorsMutation(OnboardingModal);
