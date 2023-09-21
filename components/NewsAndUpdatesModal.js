import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/Dialog';
import { Separator } from './ui/Separator';
import HTMLContent from './HTMLContent';
import Image from './Image';
import Link from './Link';
import Loading from './Loading';
import MessageBox from './MessageBox';
import StyledCarousel from './StyledCarousel';
import StyledLink from './StyledLink';
import { P, Span } from './Text';

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
      <StyledCarousel contentPosition="left">
        {data.account.updates.nodes.map(update => (
          <div key={update.id} className="px-3">
            <span className="text-sm text-muted-foreground">
              <FormattedDate value={update.publishedAt} day="numeric" month="long" year="numeric" />
            </span>
            <div className="flex">
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
            </div>
            <div className="flex pb-4 pt-2">
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
            </div>
            <div className="flex pb-1">
              <div className="w-full">
                <HTMLContent
                  collapsable
                  maxHeight={430}
                  maxCollapsedHeight={430}
                  mt={1}
                  fontSize="16px"
                  content={update.html}
                  hideViewMoreLink
                />
              </div>
            </div>
            <div className="flex pb-4 pt-1">
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
            </div>
          </div>
        ))}
      </StyledCarousel>
    );
  } else if (error) {
    return (
      <div className="flex flex-col items-center px-2 py-32">
        <MessageBox type="error" withIcon mb={5}>
          {error.message}
        </MessageBox>
      </div>
    );
  } else {
    return <Loading />;
  }
};

const NewsAndUpdatesModal = ({ open, setOpen }) => {
  const onClose = () => setOpen(false);
  return (
    <Dialog open={open} onOpenChange={open => setOpen(open)}>
      <DialogContent className="p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="mb-1.5">
                <FormattedMessage id="NewsAndUpdates.link.whatsNew" defaultMessage="What's new" />
              </DialogTitle>
              <DialogDescription>
                <FormattedMessage defaultMessage="Keep track of the latest updates from Open Collective." />
              </DialogDescription>
            </div>
            <Image
              width={64}
              height={64}
              src="/static/images/updates-and-news-modal-icon.svg"
              alt="Updates and News Icon"
              aria-hidden={true}
              className="-my-2 mr-2 h-16 w-16"
            />
          </div>
        </DialogHeader>
        <Separator className="my-3" />
        <div className="px-0 pb-6">
          <Query query={newsAndUpdatesQuery} variables={{ limit: 5 }} context={API_V2_CONTEXT}>
            {({ data, loading, error }) => renderStyledCarousel(data, loading, error, onClose)}
          </Query>
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
