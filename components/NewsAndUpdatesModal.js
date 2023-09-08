import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
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

const newsAndUpdatesQuery = gql`
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
      <StyledCarousel contentPosition="left" className="-mx-6">
        {data.account.updates.nodes.map(update => (
          <Container key={update.id} className="px-3">
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
                className="text-blue-800"
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
                className="text-blue-800"
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

const NewsAndUpdatesModal = ({ open, setOpen }) => {
  const onClose = () => setOpen(false);
  return (
    <Dialog open={open} onOpenChange={open => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Image
              width={48}
              height={48}
              src="/static/images/updates-and-news-modal-icon.svg"
              alt="Updates and News Icon"
              aria-hidden={true}
              className="-my-2 h-12 w-12"
            />
            <h2 className="text-xl">
              <FormattedMessage id="NewsAndUpdates.link.whatsNew" defaultMessage="What's new" />
            </h2>
          </DialogTitle>
        </DialogHeader>
        <hr className="-mx-6 my-1" />
        <Query query={newsAndUpdatesQuery} variables={{ limit: 5 }} context={API_V2_CONTEXT}>
          {({ data, loading, error }) => renderStyledCarousel(data, loading, error, onClose)}
        </Query>
        <hr className="-mx-6 my-1" />
        <div className="flex items-center justify-between">
          <StyledLink
            className="flex items-center gap-1.5 text-slate-600"
            href="https://twitter.com/opencollect"
            openInNewTab
            color="black.500"
          >
            <FormattedMessage id="NewsAndUpdates.link.twitterFollow" defaultMessage="Follow us" />
            <Twitter className="inline-block" size={16} color="#1153D6" />
          </StyledLink>
          <Link onClick={onClose} href="/opencollective/updates">
            <StyledButton fontSize="14px" buttonSize="tiny">
              <FormattedMessage id="NewsAndUpdates.button.seeAllUpdates" defaultMessage="See all new updates" />
            </StyledButton>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

NewsAndUpdatesModal.propTypes = {
  setOpen: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default NewsAndUpdatesModal;
