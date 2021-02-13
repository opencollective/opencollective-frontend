import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { compose } from '../lib/utils';
import { Router } from '../server/pages';

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

    try {
      const response = await this.props.createOrganization({
        variables: {
          organization,
        },
      });

      if (response) {
        await this.props.refetchLoggedInUser();
        const member = await this.props.LoggedInUser.memberOf.filter(
          member => member.collective.id === response.data.createOrganization.legacyId,
        );
        const adminList = this.state.admins.filter(admin => {
          if (admin.member.id !== this.props.LoggedInUser.collective.id) {
            return admin;
          }
        });

        this.setState({
          admins: [...adminList, { role: 'ADMIN', member: this.props.LoggedInUser.collective, id: member[0].id }],
        });

        await this.props.editCollectiveMembers({
          variables: {
            collectiveId: response.data.createOrganization.legacyId,
            members: this.state.admins.map(member => ({
              id: member.id,
              role: member.role,
              member: {
                id: member.member.id,
                name: member.member.name,
              },
            })),
          },
        });
      }
      await this.props.refetchLoggedInUser();

      Router.pushRoute('collective', {
        slug: response.data.createOrganization.slug,
        status: 'collectiveCreated',
      }).then(() => window.scrollTo(0, 0));
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

const createOrganizationMutation = gqlV2/* GraphQL */ `
  mutation CreateOrganization($organization: OrganizationCreateInput!) {
    createOrganization(organization: $organization) {
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

export default addGraphql(CreateOrganization);
