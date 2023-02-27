import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { compose } from '../lib/utils';

import { addEditCollectiveMembersMutation } from './onboarding-modal/OnboardingModal';
import Container from './Container';
import CreateOrganizationForm from './CreateOrganizationForm';
import { Box, Flex } from './Grid';
import SignInOrJoinFree from './SignInOrJoinFree';
import { H1, P } from './Text';

class CreateOrganization extends React.Component {
  static propTypes = {
    createOrganization: PropTypes.func,
    editCollectiveMembers: PropTypes.func,
    LoggedInUser: PropTypes.object,
    refetchLoggedInUser: PropTypes.func.isRequired,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { collective: { type: 'ORGANIZATION' }, result: {}, admins: [] };
    this.createOrganization = this.createOrganization.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  updateAdmins = admins => {
    this.setState({ admins });
  };

  async createOrganization(organization) {
    if (!organization.authorization) {
      this.setState({
        result: { error: 'Verify that you are an authorized organization representative' },
      });
      return;
    }

    this.setState({ status: 'loading' });

    delete organization.authorization;

    const inviteMembers = this.state.admins
      .filter(admin => {
        if (admin.member.id !== this.props.LoggedInUser.collective.id) {
          return admin;
        }
      })
      .map(admin => ({
        memberAccount: { slug: admin.member.slug },
        role: admin.role,
      }));

    try {
      const response = await this.props.createOrganization({
        variables: {
          organization,
          inviteMembers,
        },
      });

      await this.props.refetchLoggedInUser();

      this.props.router
        .push({ pathname: `/${response.data.createOrganization.slug}`, query: { status: 'collectiveCreated' } })
        .then(() => window.scrollTo(0, 0));
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ result: { error: errorMsg }, status: 'error' });
      throw new Error(errorMsg);
    }
  }

  render() {
    const { LoggedInUser } = this.props;
    const { result, collective, status } = this.state;

    return (
      <Container>
        {!LoggedInUser && (
          <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
            <Flex flexDirection="column" p={4} mt={2}>
              <Box mb={3}>
                <H1 fontSize="32px" lineHeight="36px" fontWeight="bold" textAlign="center">
                  <FormattedMessage id="collective.create.join" defaultMessage="Join Open Collective" />
                </H1>
              </Box>
              <Box textAlign="center">
                <P fontSize="14px" color="black.600" mb={1}>
                  <FormattedMessage
                    id="organization.create.createOrSignIn"
                    defaultMessage="Create an account (or sign in) to create an organization."
                  />
                </P>
              </Box>
            </Flex>
            <SignInOrJoinFree />
          </Flex>
        )}
        {LoggedInUser && (
          <CreateOrganizationForm
            collective={collective}
            onSubmit={this.createOrganization}
            onChange={this.resetError}
            error={result.error}
            updateAdmins={this.updateAdmins}
            loading={status === 'loading'}
          />
        )}
      </Container>
    );
  }
}

const createOrganizationMutation = gql`
  mutation CreateOrganization($organization: OrganizationCreateInput!, $inviteMembers: [InviteMemberInput]) {
    createOrganization(organization: $organization, inviteMembers: $inviteMembers) {
      id
      name
      slug
      description
      website
      legacyId
    }
  }
`;

const addCreateOrganizationMutation = graphql(createOrganizationMutation, {
  name: 'createOrganization',
  options: { context: API_V2_CONTEXT },
});

const addGraphql = compose(addCreateOrganizationMutation, addEditCollectiveMembersMutation);

export default addGraphql(withRouter(CreateOrganization));
