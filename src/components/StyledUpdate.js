import React, { Component } from 'react';
import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';
import { Flex, Box } from '@rebass/grid';
import { Lock } from 'styled-icons/fa-solid';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import Avatar from './Avatar';
import Role from './Role';
import Link from './Link';
import { H3 } from './Text';
import { formatDate } from '../lib/utils';

const UpdateWrapper = styled(Flex)`
  max-width: 80%;
  min-height: 100px;
  border: 1px solid #e6e8eb;
  padding: 20px;
`;

const AvatarContainer = styled(Container)`
  margin-right: 20px;
`;

class StyledUpdate extends Component {
  render() {
    const { update, collective } = this.props;

    return (
      <UpdateWrapper>
        <AvatarContainer>
          <a href={`/${update.fromCollective.slug}`} title={update.fromCollective.name}>
            <Avatar
              src={update.fromCollective.image}
              type={update.fromCollective.type}
              name={update.fromCollective.name}
              key={update.fromCollective.id}
              radius={40}
            />
          </a>
        </AvatarContainer>
        <Container display="flex" flexDirection="column">
          <Box mb={1}>
            <Link route={`/${collective.slug}/updates/${update.slug}`}>
              <H3 data-cy="updateTitle" color="#090A0A">
                {update.title}
              </H3>
            </Link>
          </Box>
          {update.summary && (
            <Container my={1} fontsize="14px" color="#4B4E52" dangerouslySetInnerHTML={{ __html: update.summary }} />
          )}
          <Container display="flex" alignItems="Baseline" color="#969BA3">
            {update.isPrivate && (
              <Box mr={2}>
                <Lock data-tip data-for="privateLockText" data-cy="privateIcon" size={12} cursor="pointer" />
                <ReactTooltip id="privateLockText">
                  <FormattedMessage id="update.private.lock_text" defaultMessage="This update is private" />
                </ReactTooltip>
              </Box>
            )}

            {update.publishedAt && (
              <Box as="span" mr={1} fontSize="12px">
                <FormattedMessage
                  id="update.publishedAtBy"
                  defaultMessage={'Published on {date} by'}
                  values={{
                    date: formatDate(update.publishedAt, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  }}
                />
              </Box>
            )}
            <Box as="span" mr={2} fontSize="12px">
              {update.fromCollective.name}
            </Box>
            <Role role="ADMIN" />
          </Container>
        </Container>
      </UpdateWrapper>
    );
  }
}

export default StyledUpdate;
