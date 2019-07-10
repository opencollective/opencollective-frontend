import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Mutation, graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';

import { Times } from 'styled-icons/fa-solid/Times';

import { Link } from '../server/pages';
import { Span } from './Text';
import LinkCollective from './LinkCollective';
import { fadeIn } from './StyledKeyframes';
import StyledButton from './StyledButton';
import StyledLink from './StyledLink';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import StyledCard from './StyledCard';
import Container from './Container';
import StyledInput from './StyledInput';
import SpeechTriangle from './icons/SpeechTriangle';
import Avatar from './Avatar';

const PublicMessagePopup = styled.div`
  position: relative;
  padding: 8px;
  margin: 32px;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  animation: ${fadeIn} 0.3s ease-in-out;

  @media screen and (min-width: 52em) {
    position: absolute;
    top: -40px;
    left: 160px;
  }
`;

const SpeechCaret = styled(SpeechTriangle)`
  position: absolute;
  left: -26px;
  top: 15%;
  color: white;
  filter: drop-shadow(-4px 4px 2px rgba(20, 20, 20, 0.09));
  height: 32px;
  width: 32px;

  @media screen and (max-width: 510px) {
    display: none;
  }
`;

const PublicMessage = styled.p`
  font-size: ${themeGet('fontSizes.Tiny')}px;
  lineheight: ${themeGet('fontSizes.Caption')}px;
  color: ${themeGet('colors.black.600')};
  margin-top: 12px;
  text-align: center;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const CollectiveLogoContainer = styled(Flex)`
  position: relative;
  border-top: 1px solid ${themeGet('colors.black.200')};
  justify-content: center;
  a {
    display: block;
    &:hover {
      opacity: 0.8;
    }
  }
  img {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    background: ${themeGet('colors.black.100')};
    display: block;
    position: absolute;
    border-radius: 8px;
    margin-top: -24px;
  }
`;

const GetMemberQuery = gql`
  query OrderMember($collectiveId: Int!, $memberCollectiveId: Int!, $tierId: Int) {
    member(CollectiveId: $collectiveId, MemberCollectiveId: $memberCollectiveId, TierId: $tierId) {
      id
      publicMessage
    }
  }
`;

const EditPublicMessageMutation = gql`
  mutation editMembership($id: Int!, $publicMessage: String) {
    editMembership(id: $id, publicMessage: $publicMessage) {
      id
      publicMessage
    }
  }
`;

const messages = defineMessages({
  publicMessagePlaceholder: {
    id: 'contribute.publicMessage.placeholder',
    defaultMessage: 'Motivate others to contribute in 140 characters :) ...',
  },
});

/**
 * A card to display the contributor, with a popup to edit public message.
 * This component fetch data for membership.
 */
class OrderSuccessContributorCardWithData extends React.Component {
  static propTypes = {
    fromCollective: PropTypes.object,
    order: PropTypes.shape({
      totalAmount: PropTypes.number,
      interval: PropTypes.string,
      currency: PropTypes.string,
    }).isRequired,
    // @ignore from injectIntl
    intl: PropTypes.object.isRequired,
    // @ignore from graphql
    data: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      messageDraft: this.getPublicMessage(props),
      hasPopup: true,
    };
  }

  componentDidMount() {
    this.initDraftFromData();
  }

  componentDidUpdate(oldProps) {
    if (this.getPublicMessage(oldProps) !== this.getPublicMessage(this.props)) {
      this.initDraftFromData();
    }
  }

  getPublicMessage(props) {
    return get(props, 'data.member.publicMessage') || '';
  }

  initDraftFromData() {
    this.setState({ messageDraft: this.getPublicMessage(this.props) });
  }

  showPopup = () => {
    this.initDraftFromData();
    this.setState({ hasPopup: true });
  };

  hidePopup = () => {
    this.setState({ hasPopup: false });
  };

  render() {
    const { order, fromCollective, intl, data } = this.props;
    const { totalAmount, interval, currency } = order;
    const { messageDraft, hasPopup } = this.state;
    const publicMessageMaxLength = 140;
    const member = data && data.member;

    return (
      <Container display="flex" position="relative" flexWrap="wrap" justifyContent="center" p={2} mb={4}>
        <StyledCard className="collective-card" width={160}>
          <CollectiveLogoContainer mt={47}>
            <Box mt={-32}>
              <LinkCollective collective={fromCollective}>
                <Avatar collective={fromCollective} />
              </LinkCollective>
            </Box>
          </CollectiveLogoContainer>
          <Container
            display="flex"
            mt={2}
            justifyContent="center"
            fontSize="Paragraph"
            fontWeight="bold"
            lineHeight="Caption"
            color="black.900"
          >
            <LinkCollective collective={fromCollective}>{fromCollective.name}</LinkCollective>
          </Container>
          <Flex flexDirection="column" p={12} alignItems="center">
            {totalAmount !== 0 && (
              <React.Fragment>
                <Span fontSize="10px">
                  <FormattedMessage id="contributeFlow.contributedTotal" defaultMessage="Contributed a total of:" />
                </Span>
                <FormattedMoneyAmount
                  fontWeight="bold"
                  fontSize="Caption"
                  color="black.900"
                  abbreviateInterval={false}
                  precision={2}
                  amount={totalAmount}
                  currency={currency}
                  interval={interval}
                />
                {member && member.publicMessage && (
                  <Container textAlign="center" color="black.600">
                    <PublicMessage onClick={this.showPopup}>“{member.publicMessage}”</PublicMessage>
                  </Container>
                )}
                {member && !member.publicMessage && !hasPopup && (
                  <Span
                    mt={2}
                    cursor="pointer"
                    fontSize="Tiny"
                    color="black.600"
                    textAlign="center"
                    onClick={this.showPopup}
                  >
                    <FormattedMessage
                      id="contribute.publicMessage"
                      defaultMessage="Leave a public message (Optional)"
                    />
                  </Span>
                )}
              </React.Fragment>
            )}
          </Flex>
        </StyledCard>
        {hasPopup && (
          <Mutation mutation={EditPublicMessageMutation}>
            {(submitMessage, { loading, error }) => (
              <PublicMessagePopup data-cy="public-message-popup">
                <Flex justifyContent="flex-end">
                  <Times size="1em" color="#a2a2a2" cursor="pointer" onClick={this.hidePopup} />
                </Flex>
                <Flex flexDirection="column" p={2}>
                  <Span fontSize="Paragraph" color="black.600" mb={2}>
                    <FormattedMessage
                      id="contribute.publicMessage"
                      defaultMessage="Leave a public message (Optional)"
                    />
                  </Span>

                  <StyledInput
                    name="publicMessage"
                    as="textarea"
                    px={10}
                    py={10}
                    width={240}
                    height={112}
                    fontSize="Paragraph"
                    style={{ resize: 'none' }}
                    placeholder={intl.formatMessage(messages.publicMessagePlaceholder)}
                    value={messageDraft}
                    onChange={e => this.setState({ messageDraft: e.target.value.slice(0, publicMessageMaxLength) })}
                    maxLength={publicMessageMaxLength}
                    disabled={loading || data.loading}
                  />
                  {error && (
                    <Span color="red.500" fontSize="Caption" mt={2}>
                      {error}
                    </Span>
                  )}
                  <Box m="0 auto">
                    <StyledButton
                      buttonSize="small"
                      fontWeight="bold"
                      px={4}
                      mt={3}
                      onClick={async () => {
                        await submitMessage({
                          variables: {
                            id: member.id,
                            publicMessage: messageDraft ? messageDraft.trim() : null,
                          },
                        });
                        this.hidePopup();
                      }}
                      loading={loading || data.loading}
                      disabled={data.loading}
                    >
                      <FormattedMessage id="button.submit" defaultMessage="Submit" />
                    </StyledButton>
                  </Box>
                </Flex>
                <SpeechCaret />
              </PublicMessagePopup>
            )}
          </Mutation>
        )}
      </Container>
    );
  }
}

export default injectIntl(
  graphql(GetMemberQuery, {
    options(props) {
      const { collective, fromCollective, tier } = props.order;
      const variables = { collectiveId: collective.id, memberCollectiveId: fromCollective.id };
      if (tier) {
        variables.tierId = tier.id;
      }
      return { variables };
    },
  })(OrderSuccessContributorCardWithData),
);
