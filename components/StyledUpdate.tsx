import React, { Component } from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { Markup } from 'interweave';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { borders } from 'styled-system';

import { FEATURES, isFeatureEnabled } from '../lib/allowed-features';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import { getCollectivePageRoute, getDashboardRoute } from '../lib/url-helpers';
import { compose, formatDate } from '../lib/utils';

import EmojiReactionPicker from './conversations/EmojiReactionPicker';
import CommentReactions from './conversations/EmojiReactions';
import { UpdateStatus } from './dashboard/sections/updates/common';
import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import HTMLContent from './HTMLContent';
import { getI18nLink } from './I18nFormatters';
import Link from './Link';
import LinkCollective from './LinkCollective';
import LoadingPlaceholder from './LoadingPlaceholder';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';

const UpdateWrapper = styled(Flex)`
  max-width: 100%;
  min-height: 100px;
  padding: 20px;

  ${borders}

  img {
    max-width: 100%;
  }

  @media (max-width: 600px) {
    max-width: 100%;
  }
`;

const PrivateUpdateMesgBox = styled(MessageBox)`
  height: 40px;
  background: #f0f8ff;
  border: 1px solid #b8deff;
  box-sizing: border-box;
  border-radius: 6px;
  margin-top: 10px;
  padding: 10px;
  font-size: 12px;
  color: #71757a;
  display: flex;
  align-items: center;
`;

type StyledUpdateProps = {
  collective: any;
  update: any;
  compact?: boolean;
  LoggedInUser?: any;
  isReloadingData?: boolean;
  deleteUpdate?: ({ variables }: { variables: { id: string } }) => void;
  intl: any;
  router: any;
  /** Reactions associated with this update **/
  reactions?: any;
};

interface StyledUpdateProps {
  collective: object;
  update: object;
  compact?: boolean;
  LoggedInUser?: object // if compact true, only show the summary;
  isReloadingData?: boolean;
  deleteUpdate(...args: unknown[]): unknown;
  intl: object;
  router?: object;
  /** Reactions associated with this update **/
  reactions?: object;
}

class StyledUpdate extends Component<StyledUpdateProps> {
  constructor(props: StyledUpdateProps) {
    super(props);
    this.state = {
      modified: false,
      update: {},
      mode: props.compact ? 'summary' : 'details',
    };

    this.messages = defineMessages({
      edit: { id: 'Edit', defaultMessage: 'Edit' },
      cancelEdit: { id: 'CancelEdit', defaultMessage: 'Cancel edit' },
      viewLatestUpdates: {
        id: 'update.viewLatestUpdates',
        defaultMessage: 'View latest updates',
      },
    });
  }

  private messages: any;

  deleteUpdate = async () => {
    if (!confirm('😱 Are you really sure you want to delete this update?')) {
      return;
    }

    try {
      await this.props.deleteUpdate({ variables: { id: this.props.update.id } });
      this.props.router.push(`/${this.props.collective.slug}`);
    } catch (err) {
      // TODO: this should be reported to the user
      // eslint-disable-next-line no-console
      console.error('Update -> deleteUpdate -> error: ', err);
    }
  };

  renderUpdateMeta(update, isAdmin, editable) {
    const { intl, collective } = this.props;
    const { mode } = this.state;
    const fromAccount = update.fromCollective || update.fromAccount;

    return (
      <div data-cy="meta" className="flex flex-wrap items-baseline gap-2">
        {isAdmin && <UpdateStatus update={update} />}
        {update.publishedAt ? (
          <Box as="span" fontSize="12px">
            <FormattedMessage
              id="update.publishedAtBy"
              defaultMessage="Published on {date} by {author}"
              values={{
                date: formatDate(update.publishedAt, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
                author: (
                  <Box as="span" mr={2} fontSize="12px">
                    <LinkCollective collective={fromAccount} />
                  </Box>
                ),
              }}
            />
          </Box>
        ) : (
          <Box as="span" fontSize="12px">
            <FormattedMessage
              id="update.createdAtBy"
              defaultMessage="Created on {date} (draft) by {author}"
              values={{
                date: formatDate(update.createdAt),
                author: (
                  <Box as="span" mr={2} fontSize="12px">
                    <LinkCollective collective={fromAccount} />
                  </Box>
                ),
              }}
            />
          </Box>
        )}
        {editable && (
          <div className="flex gap-1">
            <Box fontSize="12px">
              <Link href={getDashboardRoute(collective, `updates/edit/${update.id}`)}>
                <StyledButton buttonSize="tiny" data-cy="toggleEditUpdate">
                  {intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
                </StyledButton>
              </Link>
            </Box>
            <Box fontSize="12px">
              <StyledButton buttonSize="tiny" onClick={this.deleteUpdate}>
                <FormattedMessage id="actions.delete" defaultMessage="Delete" />
              </StyledButton>
            </Box>
          </div>
        )}
      </div>
    );
  }

  renderUpdateTitle() {
    const { update, collective } = this.props;
    const { mode } = this.state;
    if (mode === 'summary') {
      return (
        <Link href={`${getCollectivePageRoute(collective)}/updates/${update.slug}`}>
          <h5 className="text-lg font-medium" data-cy="updateTitle">
            {update.title}
          </h5>
        </Link>
      );
    } else {
      return (
        <h5 className="mb-2 text-lg font-medium" data-cy="updateTitle">
          {update.title}
        </h5>
      );
    }
  }

  renderSummary(update) {
    const { collective, isReloadingData } = this.props;
    return (
      <React.Fragment>
        {update.userCanSeeUpdate && (
          <Container mb={2} pl={[0, 60]} fontSize="14px" color="#4B4E52" css={{ wordBreak: 'break-word' }}>
            <Markup noWrap content={update.summary} />
          </Container>
        )}
        {!update.userCanSeeUpdate && !isReloadingData && (
          <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
            <FormattedMessage
              id="update.private.cannot_view_message"
              defaultMessage="Contribute to {collective} to see this Update"
              values={{ collective: collective.name }}
            />
          </PrivateUpdateMesgBox>
        )}
      </React.Fragment>
    );
  }

  renderFullContent() {
    const { update, collective, isReloadingData, reactions, LoggedInUser } = this.props;

    return (
      <Container css={{ wordBreak: 'break-word' }} pl={[0, 60]} maxWidth={718}>
        <StyledHr mt={3} mb={4} borderColor="black.100" />
        {update.html ? (
          <React.Fragment>
            <HTMLContent content={update.html} />
            {update.publishedAt && (
              <Flex mt={3} flexWrap="wrap" data-cy="update-reactions">
                {reactions && <CommentReactions reactions={reactions} />}
                {LoggedInUser && <EmojiReactionPicker update={update} />}
              </Flex>
            )}
          </React.Fragment>
        ) : !update.userCanSeeUpdate && !isReloadingData ? (
          <PrivateUpdateMesgBox type="info" data-cy="mesgBox">
            <FormattedMessage
              id="update.private.cannot_view_message"
              defaultMessage="Contribute to {collective} to see this Update"
              values={{ collective: collective.name }}
            />
          </PrivateUpdateMesgBox>
        ) : isReloadingData ? (
          <LoadingPlaceholder height={300} />
        ) : null}
        {collective.isFrozen ? (
          <MessageBox withIcon type="warning" mt={3}>
            <FormattedMessage
              defaultMessage="This account is currently frozen and cannot be used to publish updates."
              id="qstjb6"
            />{' '}
            {isFeatureEnabled(collective.host, FEATURES.CONTACT_FORM) && (
              <FormattedMessage
                defaultMessage="Please <ContactLink>contact</ContactLink> your fiscal host for more details."
                id="KxBiJC"
                values={{ ContactLink: getI18nLink({ href: `${getCollectivePageRoute(collective.host)}/contact` }) }}
              />
            )}
          </MessageBox>
        ) : null}
      </Container>
    );
  }

  render() {
    const { update, intl, collective, compact, LoggedInUser, ...props } = this.props;
    const { mode } = this.state;
    const canEditUpdate = LoggedInUser && LoggedInUser.canEditUpdate(update);
    const editable = !compact && canEditUpdate;
    const fromAccount = update.fromCollective || update.fromAccount;

    return (
      <React.Fragment>
        <UpdateWrapper {...props}>
          {mode !== 'edit' && (
            <Container width="100%">
              <Flex mb={2}>
                <Container mr={20}>
                  <LinkCollective collective={fromAccount}>
                    <Avatar collective={fromAccount} radius={40} />
                  </LinkCollective>
                </Container>
                <Box>
                  {this.renderUpdateTitle()}
                  {this.renderUpdateMeta(update, canEditUpdate, editable)}
                </Box>
              </Flex>
              {mode === 'summary' && this.renderSummary(update)}
              {mode === 'details' && this.renderFullContent()}
            </Container>
          )}
        </UpdateWrapper>
        {update.publishedAt && mode === 'details' && (
          <Flex my={3} justifyContent={['center', 'flex-start']}>
            <Link href={`${getCollectivePageRoute(collective)}/updates`}>
              <StyledButton ml={[0, 5]}>{intl.formatMessage(this.messages['viewLatestUpdates'])}</StyledButton>
            </Link>
          </Flex>
        )}
      </React.Fragment>
    );
  }
}

const deleteUpdateMutation = gql`
  mutation DeleteUpdate($id: String!) {
    deleteUpdate(id: $id) {
      id
    }
  }
`;

const addDeleteUpdateMutation = graphql(deleteUpdateMutation, {
  name: 'deleteUpdate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addGraphql = compose(addDeleteUpdateMutation);

export default injectIntl<'intl', Omit<StyledUpdateProps, 'router'>>(addGraphql(withRouter(StyledUpdate)));
