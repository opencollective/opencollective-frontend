import React from 'react';
import PropTypes from 'prop-types';
import { Query } from '@apollo/client/react/components';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import Container from './Container';
import { Flex } from './Grid';
import HTMLContent from './HTMLContent';
import Image from './Image';
import Link from './Link';
import Loading from './Loading';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCarousel from './StyledCarousel';
import StyledLink from './StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { P, Span } from './Text';

const ModalHeaderWrapper = styled(ModalHeader)`
  height: 58px;
`;

const ModalWrapper = styled(StyledModal)`
  padding-top: 8px;
  padding-bottom: 0px;
`;

const ModalFooterWrapper = styled(ModalFooter)`
  height: 65px;
`;

const newsAndUpdatesQuery = gqlV2/* GraphQL */ `
  query ChangelogUpdates($limit: Int) {
    account(slug: "opencollective") {
      id
      updates(
        orderBy: { field: PUBLISHED_AT, direction: DESC }
        onlyChangelogUpdates: true
        onlyPublishedUpdates: true
        limit: $limit
      ) {
        nodes {
          id
          slug
          publishedAt
          title
          html
          summary
        }
      }
    }
  }
`;

const renderStyledCarousel = (data, loading, error, onClose) => {
  if (loading === false && data) {
    return (
      <StyledCarousel contentPosition="left">
        {data.account.updates.nodes.map(update => (
          <Container key={update.id}>
            <Container fontSize="13px" lineHeight="20px" color="black.700">
              <FormattedDate value={update.publishedAt} day="numeric" month="long" year="numeric" />
            </Container>
            <Flex>
              <Span paddingTop="10px">
                <Image
                  width={12}
                  height={12}
                  src="/static/images/news-and-updates-ellipse.svg"
                  alt="News and Updates Ellipse"
                />
              </Span>
              <P fontSize="20px" margin="0px 12px" fontWeight="500" lineHeight="36px" color="black.900">
                {update.title}
              </P>
            </Flex>
            <Flex pt={2} pb={3}>
              <StyledLink
                onClick={onClose}
                as={Link}
                href={`/opencollective/updates/${update.slug}`}
                color="blue.700"
                fontSize="14px"
                display="flex"
              >
                <FormattedMessage id="NewsAndUpdates.link.giveFeedback" defaultMessage="Read more & give Feedback" />
              </StyledLink>
            </Flex>
            <Flex pb={1}>
              <Container width="100%">
                <HTMLContent
                  collapsable
                  maxHeight={430}
                  maxCollapsedHeight={430}
                  color="black.800"
                  mt={1}
                  fontSize="16px"
                  content={update.html}
                  hideViewMoreLink
                />
              </Container>
            </Flex>
            <Flex pt={1} pb={3}>
              <StyledLink
                onClick={onClose}
                as={Link}
                href={`/opencollective/updates/${update.slug}`}
                fontSize="14px"
                display="flex"
              >
                <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
              </StyledLink>
            </Flex>
          </Container>
        ))}
      </StyledCarousel>
    );
  } else if (error) {
    return (
      <Flex flexDirection="column" alignItems="center" px={2} py={6}>
        <MessageBox type="error" withIcon mb={5}>
          {error.message}
        </MessageBox>
      </Flex>
    );
  } else {
    return <Loading />;
  }
};

const NewsAndUpdatesModal = ({ onClose, ...modalProps }) => {
  return (
    <ModalWrapper onClose={onClose} width="576px" {...modalProps}>
      <ModalHeaderWrapper onClose={onClose}>
        <Flex width="100%">
          <Flex>
            <Span>
              <Image
                width={72}
                height={72}
                src="/static/images/updates-and-news-modal-icon.svg"
                alt="Updates and News Icon"
              />
            </Span>
            <P fontSize={['25px', '28px']} fontWeight="500" lineHeight="36px" color="black.900" ml={16} mt="18px">
              <FormattedMessage id="NewsAndUpdates.link.whatsNew" defaultMessage="What's new" />
            </P>
          </Flex>
        </Flex>
      </ModalHeaderWrapper>
      <hr />
      <ModalBody>
        <Query query={newsAndUpdatesQuery} variables={{ limit: 5 }} context={API_V2_CONTEXT}>
          {({ data, loading, error }) => renderStyledCarousel(data, loading, error, onClose)}
        </Query>
      </ModalBody>
      <ModalFooterWrapper isFullWidth>
        <Container display="flex">
          <Flex width={1 / 2}>
            <StyledLink href="https://twitter.com/opencollect" openInNewTab color="black.500" display="flex" mt={1}>
              <Span pr={2}>
                <FormattedMessage id="NewsAndUpdates.link.twitterFollow" defaultMessage="Follow us" />
              </Span>
              <Span>
                <Twitter size={17} color="#1153D6" />
              </Span>
            </StyledLink>
          </Flex>
          <Flex width={1 / 2} justifyContent="right" mb="16px">
            <Link onClick={onClose} href="/opencollective/updates">
              <StyledButton buttonSize="tiny">
                <Span fontSize={['11px', '14px']}>
                  <FormattedMessage id="NewsAndUpdates.button.seeAllUpdates" defaultMessage="See all new updates" />
                </Span>
              </StyledButton>
            </Link>
          </Flex>
        </Container>
      </ModalFooterWrapper>
    </ModalWrapper>
  );
};

NewsAndUpdatesModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  router: PropTypes.object,
};

export default NewsAndUpdatesModal;
