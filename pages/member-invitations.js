import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../lib/utils';
import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import { H1 } from '../components/Text';
import MemberInvitationsList from '../components/MemberInvitationsList';

const memberInvitationsPageQuery = gql`
  query MemberInvitationsPage($memberCollectiveId: Int!) {
    memberInvitations(MemberCollectiveId: $memberCollectiveId) {
      id
      createdAt
      role
      description
      collective {
        id
        slug
        name
        type
        imageUrl
      }
    }
  }
`;

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class MemberInvitationsPage extends React.Component {
  getSelectedInvitationIdFromRoute() {
    try {
      const hash = window.location.hash;
      const regex = /invitation-(\d+)/;
      const idStr = regex.exec(hash)[1];
      const idInt = parseInt(idStr);
      return idInt || null;
    } catch {
      return null;
    }
  }

  render() {
    return (
      <AuthenticatedPage noRobots title="Pending invitations" withoutGlobalStyles>
        {LoggedInUser => (
          <Query
            query={memberInvitationsPageQuery}
            variables={{ memberCollectiveId: LoggedInUser.CollectiveId }}
            fetchPolicy="network-only"
          >
            {({ data, error, loading }) => (
              <Container background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" py={[4, 5, 6]} px={[2, 3, 4]}>
                {loading ? (
                  <Loading />
                ) : (
                  <div>
                    <H1 mb={5}>
                      <FormattedMessage id="MemberInvitations.title" defaultMessage="Pending invitations" />
                    </H1>
                    {!data || !data.memberInvitations || error ? (
                      <MessageBox type="error" withIcon>
                        {getErrorFromGraphqlException(error).message}
                      </MessageBox>
                    ) : (
                      <MemberInvitationsList
                        invitations={data.memberInvitations}
                        selectedInvitationId={this.getSelectedInvitationIdFromRoute()}
                      />
                    )}
                  </div>
                )}
              </Container>
            )}
          </Query>
        )}
      </AuthenticatedPage>
    );
  }
}

export default MemberInvitationsPage;
