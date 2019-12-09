import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';

import StyledCard from '../StyledCard';
import Container from '../Container';
import { H5, P } from '../Text';
import Avatar from '../Avatar';
import LinkCollective from '../LinkCollective';
import Link from '../Link';
import { FormattedMessage, FormattedDate } from 'react-intl';

/**
 * Displays a list of conversations
 */
const ConversationsList = ({ collectiveSlug, conversations }) => {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <StyledCard>
      {conversations.map(({ id, slug, title, summary, createdAt, fromCollective }, idx) => (
        <Container key={id} borderTop={!idx ? undefined : '1px solid'} borderColor="black.300" p={3}>
          <Flex>
            <Box mr={3}>
              <LinkCollective collective={fromCollective}>
                <Avatar collective={fromCollective} radius={40} />
              </LinkCollective>
            </Box>
            <div>
              <Link route="conversation" params={{ collectiveSlug, slug, id }}>
                <H5>{title}</H5>
              </Link>
              <P color="black.500" fontSize="Caption">
                <FormattedMessage
                  id="update.publishedAtBy"
                  defaultMessage="Published on {date} by {author}"
                  values={{
                    date: <FormattedDate value={createdAt} day="numeric" month="long" year="numeric" />,
                    author: <LinkCollective collective={fromCollective} />,
                  }}
                />
              </P>
              <P color="black.700" mt={2} fontSize="13px" dangerouslySetInnerHTML={{ __html: summary }} />
            </div>
          </Flex>
        </Container>
      ))}
    </StyledCard>
  );
};

ConversationsList.propTypes = {
  collectiveSlug: PropTypes.string.isRequired,
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string),
      fromCollective: PropTypes.shape({
        type: PropTypes.string,
        slug: PropTypes.string.isRequired,
      }).isRequired,
    }),
  ),
};

export default ConversationsList;
