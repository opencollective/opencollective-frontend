import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get, isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';

import ConversationsList from '../../conversations/ConversationsList';
import { conversationListFragment } from '../../conversations/graphql';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import { P, Span } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

export const conversationsSectionQuery = gql`
  query ConversationsSection($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      conversations(limit: 3) {
        ...ConversationListFragment
      }
    }
  }
  ${conversationListFragment}
`;

/**
 * Conversations section.
 */
class SectionConversations extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,

    /** Conversations */
    data: PropTypes.shape({
      account: PropTypes.shape({
        conversations: PropTypes.shape({
          totalCount: PropTypes.number,
          nodes: PropTypes.arrayOf(PropTypes.object),
        }),
      }),
    }),
  };

  render() {
    const { collective, data } = this.props;
    const conversations = get(data, 'account.conversations', {});

    return (
      <ContainerSectionContent pb={4}>
        <SectionTitle fontSize={['20px', '24px', '32px']} color="black.700" mb={24}>
          <FormattedMessage id="conversations" defaultMessage="Conversations" />
        </SectionTitle>
        <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <P color="black.700" my={2} css={{ flex: '1 0 50%', maxWidth: 700 }}>
            <FormattedMessage
              id="conversations.subtitle"
              defaultMessage="Let’s get the discussion going! This is a space for the community to converse, ask questions, say thank you, and get things done together."
            />
          </P>
          <Link href={`/${collective.slug}/conversations/new`}>
            <StyledButton buttonStyle="primary" my={[2, 0]}>
              <Span fontSize="16px" fontWeight="bold" mr={2}>
                +
              </Span>
              <FormattedMessage id="conversations.create" defaultMessage="Create a Conversation" />
            </StyledButton>
          </Link>
        </Flex>
        {isEmpty(conversations.nodes) ? (
          <div>
            <MessageBox my={[3, 5]} type="info" withIcon maxWidth={700} fontStyle="italic" fontSize="14px">
              <FormattedMessage
                id="SectionConversations.PostFirst"
                defaultMessage="Use this section to get the community involved in open discussions."
              />
            </MessageBox>
          </div>
        ) : (
          <Box mt={[3, 5]} mb={[3, 4]}>
            <ConversationsList collectiveSlug={collective.slug} conversations={conversations.nodes} />
            {conversations.totalCount > 3 && (
              <Link href={`/${collective.slug}/conversations`}>
                <StyledButton width="100%" mt={4} buttonSize="small" fontSize="14px">
                  <FormattedMessage id="Conversations.ViewAll" defaultMessage="View all Conversations" /> →
                </StyledButton>
              </Link>
            )}
          </Box>
        )}
      </ContainerSectionContent>
    );
  }
}

const addConversationsSectionData = graphql(conversationsSectionQuery, {
  options: props => ({
    variables: getConversationsSectionQueryVariables(props.collective.slug),
    context: API_V2_CONTEXT,
  }),
});

export const getConversationsSectionQueryVariables = slug => {
  return { collectiveSlug: slug };
};

export default addConversationsSectionData(SectionConversations);
