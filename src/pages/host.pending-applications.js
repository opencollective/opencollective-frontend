import React from 'react';
import PropTypes from 'prop-types';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import { Check } from 'styled-icons/boxicons-regular/Check';
import { Github } from 'styled-icons/fa-brands/Github';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import StyledCard from '../components/StyledCard';
import { H1, Span } from '../components/Text';
import Container from '../components/Container';
import LinkCollective from '../components/LinkCollective';
import StyledButton from '../components/StyledButton';
import StyledHr from '../components/StyledHr';
import ExternalLinkNewTab from '../components/ExternalLinkNewTab';
import Avatar from '../components/Avatar';
import MessageBox from '../components/MessageBox';

const GetPendingApplications = gql`
  query HostPendingApplications($hostCollectiveSlug: String!) {
    Collective(slug: $hostCollectiveSlug) {
      id
      slug
      name
      pending: collectives(isActive: false, isArchived: false, orderBy: createdAt, orderDirection: DESC) {
        collectives {
          id
          slug
          name
          githubHandle
          type
          isActive
        }
      }
    }
  }
`;

const ApproveCollectiveMutation = gql`
  mutation approveCollective($id: Int!) {
    approveCollective(id: $id) {
      id
      isActive
    }
  }
`;

class HostPendingApplicationsPage extends React.Component {
  static propTypes = {
    loadingLoggedInUser: PropTypes.bool,
    hostCollectiveSlug: PropTypes.string.isRequired,
  };

  static getInitialProps({ query: { hostCollectiveSlug } }) {
    return { hostCollectiveSlug };
  }

  renderPendingCollectives(data) {
    const pendingCollectives = get(data, 'Collective.pending.collectives', []);
    const notApprovedCount = pendingCollectives.reduce((total, c) => {
      return total + (c.isActive ? 0 : 1);
    }, 0);

    return (
      <Container
        display="flex"
        background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
        flexDirection="column"
        alignItems="center"
        px={2}
        py={5}
      >
        <Container maxWidth={800}>
          <H1 mb={5}>
            <FormattedMessage
              id="host.pending-applications.title"
              defaultMessage="Pending applications for {hostName}"
              values={{ hostName: data.Collective.name }}
            />
          </H1>
        </Container>

        <MessageBox type="info" withIcon mb={4}>
          {notApprovedCount > 0 ? (
            <FormattedMessage
              id="host.pending-applications.pendingCount"
              defaultMessage="{count, plural, one {One collective is} other {{count} collectives are}} waiting for your approval to be hosted"
              values={{ count: notApprovedCount }}
            />
          ) : (
            <FormattedMessage
              id="host.pending-applications.noPending"
              defaultMessage="No collective waiting for approval"
            />
          )}
        </MessageBox>

        {pendingCollectives.map(c => (
          <StyledCard
            key={c.id}
            width={1}
            maxWidth={400}
            p={3}
            mb={4}
            boxShadow="rgba(144, 144, 144, 0.25) 4px 4px 16px"
          >
            <Flex>
              <Avatar mr={2} radius={42} name={c.name} src={c.image} type={c.type} />
              <Container pl={2} flex="1 1" borderLeft="1px solid #e8e8e8">
                <div>
                  <LinkCollective collective={c}>
                    <strong>{c.name}</strong> <small>({c.slug})</small>
                  </LinkCollective>
                </div>
                {c.githubHandle && (
                  <ExternalLinkNewTab href={`https://github.com/${c.githubHandle}`}>
                    <Github size="1em" />
                    <Span ml={1}>{c.githubHandle}</Span>
                  </ExternalLinkNewTab>
                )}
              </Container>
            </Flex>
            <StyledHr my={3} borderColor="black.200" />
            <Flex justifyContent="center">
              {c.isActive ? (
                <Box color="green.700">
                  <Check size={39} />
                </Box>
              ) : (
                <Mutation mutation={ApproveCollectiveMutation}>
                  {(approveCollective, { loading }) => (
                    <StyledButton loading={loading} onClick={() => approveCollective({ variables: { id: c.id } })}>
                      <FormattedMessage id="host.pending-applications.approve" defaultMessage="Approve" />
                    </StyledButton>
                  )}
                </Mutation>
              )}
            </Flex>
          </StyledCard>
        ))}
      </Container>
    );
  }

  render() {
    const { loadingLoggedInUser, hostCollectiveSlug } = this.props;

    return (
      <Query query={GetPendingApplications} variables={{ hostCollectiveSlug }}>
        {({ loading, error, data }) =>
          !data || error ? (
            <ErrorPage data={data} />
          ) : (
            <Page title="Pending host approvals">
              {loading || loadingLoggedInUser ? (
                <Box px={2} py={5}>
                  <Loading />
                </Box>
              ) : (
                this.renderPendingCollectives(data)
              )}
            </Page>
          )
        }
      </Query>
    );
  }
}

export default withUser(withIntl(HostPendingApplicationsPage));
