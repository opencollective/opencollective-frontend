import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { isEmpty } from 'lodash';

import { P } from '../../Text';
import Link from '../../Link';
import StyledButton from '../../StyledButton';

import SectionTitle from '../SectionTitle';
import ContainerSectionContent from '../ContainerSectionContent';
import ConversationsList from '../../conversations/ConversationsList';

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
    conversations: PropTypes.shape({
      total: PropTypes.number,
      nodes: PropTypes.arrayOf(PropTypes.object),
    }),
  };

  render() {
    const { collective, conversations } = this.props;

    return (
      <ContainerSectionContent pt={5}>
        <SectionTitle mb={24}>
          <FormattedMessage id="CollectivePage.SectionConversations.Title" defaultMessage="Conversations" />
        </SectionTitle>
        <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <P color="black.700" my={2} mr={2} css={{ flex: '1 0 50%', maxWidth: 780 }}>
            <FormattedMessage
              id="conversations.subtitle"
              defaultMessage="Let’s get the ball rolling! This is where things get planned and sometimes this is where things get done. Ask questions, thank people for their efforts, and contribute your skills to the service of the community."
            />
          </P>
          <Link route="create-conversation" params={{ collectiveSlug: collective.slug }}>
            <StyledButton buttonStyle="primary">
              <FormattedMessage id="conversations.create" defaultMessage="Create conversation" />
            </StyledButton>
          </Link>
        </Flex>
        {isEmpty(conversations.nodes) ? (
          <Box my={5}>
            <Link route="create-conversation" params={{ collectiveSlug: collective.slug }}>
              <StyledButton buttonStyle="primary" buttonSize="large">
                <FormattedMessage id="conversations.createFirst" defaultMessage="Start a new conversation" />
              </StyledButton>
            </Link>
          </Box>
        ) : (
          <Box>
            <ConversationsList collectiveSlug={collective.slug} conversations={conversations.nodes} />
            {conversations.total > 3 && (
              <Link route="conversations" params={{ collectiveSlug: collective.slug }}>
                <StyledButton width="100%" mt={4} p="10px">
                  <FormattedMessage id="Conversations.ViewAll" defaultMessage="View all conversations" /> →
                </StyledButton>
              </Link>
            )}
          </Box>
        )}
      </ContainerSectionContent>
    );
  }
}

export default SectionConversations;
