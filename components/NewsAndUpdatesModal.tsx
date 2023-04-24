import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { Dialog, Transition } from '@headlessui/react';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import HTMLContent from './HTMLContent';
import Image from './Image';
import Link from './Link';
import Loading from './Loading';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCarousel from './StyledCarousel';
import StyledLink from './StyledLink';
import StyledModal, { ModalBody, ModalFooter as OldModalFooter, ModalHeader as OldModalHeader } from './StyledModal';
import Modal, { ModalHeader, ModalFooter } from './Modal';
import { P } from './Text';

const ModalHeaderWrapper = styled(OldModalHeader)`
  height: 58px;
`;

const ModalWrapper = styled(StyledModal)`
  padding-top: 8px;
  padding-bottom: 0px;
`;

const ModalFooterWrapper = styled(OldModalFooter)`
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
      <StyledCarousel contentPosition="left">
        {data.account.updates.nodes.map(update => (
          <div key={update.id}>
            <div className="text-sm text-gray-700">
              <FormattedDate value={update.publishedAt} day="numeric" month="long" year="numeric" />
            </div>
            <div className="flex">
              <span className="pt-2.5">
                <Image
                  width={12}
                  height={12}
                  src="/static/images/news-and-updates-ellipse.svg"
                  alt="News and Updates Ellipse"
                />
              </span>
              <p className="mx-3 text-xl font-medium leading-9 text-gray-900">{update.title}</p>
            </div>
            <div className="pb-4 pt-2">
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
            </div>
            <div className="pb-1">
              <div className="w-full">
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
              </div>
            </div>
            <div className="flex pb-4 pt-1">
              <StyledLink
                onClick={onClose}
                as={Link}
                href={`/opencollective/updates/${update.slug}`}
                fontSize="14px"
                display="flex"
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

const NewsAndUpdatesModal = ({ show, onClose, ...modalProps }) => {
  const intl = useIntl();
  return (
    <Modal show={show} onClose={onClose} hideCloseIcon={false} width="xl" {...modalProps}>
      <ModalHeader
        title={intl.formatMessage({ id: 'NewsAndUpdates.link.whatsNew', defaultMessage: "What's new" })}
        icon={
          <div className="relative overflow-hidden">
            <Image
              width={64}
              height={48}
              src="/static/images/updates-and-news-modal-icon.svg"
              alt="Updates and News Icon"
              className="object-cover"
            />
          </div>
        }
      ></ModalHeader>

      {/* <ModalHeaderWrapper onClose={onClose}>
        <Flex width="100%">
          <Flex>
            <Span>
              <Image
                width={32}
                height={32}
                src="/static/images/updates-and-news-modal-icon.svg"
                alt="Updates and News Icon"
              />
            </Span>
            <P fontSize={['25px', '28px']} fontWeight="500" lineHeight="36px" color="black.900" ml={16} mt="18px">
              <FormattedMessage id="NewsAndUpdates.link.whatsNew" defaultMessage="What's new" />
            </P>
          </Flex>
        </Flex>
      </ModalHeaderWrapper> */}
      <hr />

      <Query query={newsAndUpdatesQuery} variables={{ limit: 5 }} context={API_V2_CONTEXT}>
        {({ data, loading, error }) => renderStyledCarousel(data, loading, error, onClose)}
      </Query>
      <ModalFooter showDivider>
        <div className="flex justify-between gap-2">
          <StyledLink href="https://twitter.com/opencollect" openInNewTab color="black.500" display="flex" mt={1}>
            <span className="pr-2">
              <FormattedMessage id="NewsAndUpdates.link.twitterFollow" defaultMessage="Follow us" />
            </span>
            <span>
              <Twitter size={17} color="#1153D6" />
            </span>
          </StyledLink>
          <Link onClick={onClose} href="/opencollective/updates">
            <StyledButton buttonSize="tiny">
              <span className="text-xs sm:text-sm">
                <FormattedMessage id="NewsAndUpdates.button.seeAllUpdates" defaultMessage="See all new updates" />
              </span>
            </StyledButton>
          </Link>
        </div>
      </ModalFooter>
    </Modal>
  );
};

NewsAndUpdatesModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  router: PropTypes.object,
};

export default NewsAndUpdatesModal;
