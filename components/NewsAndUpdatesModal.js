import React from 'react';
import PropTypes from 'prop-types';
import { Query } from '@apollo/client/react/components';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import Container from './Container';
import { Flex } from './Grid';
import HTMLContent from './HTMLContent';
import Image from './Image';
import Link from './Link';
import Loading from './Loading';
import StyledButton from './StyledButton';
import StyledCarousel from './StyledCarousel';
import StyledLink from './StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { P, Span } from './Text';

const newsAndUpdatesQuery = gqlV2/* GraphQL */ `
  query ChangelogUpdates($collectiveSlug: String, $onlyChangelogUpdates: Boolean) {
    account(slug: $collectiveSlug) {
      id
      updates(onlyChangelogUpdates: $onlyChangelogUpdates) {
        nodes {
          id
          slug
          publishedAt
          title
          summary
        }
      }
    }
  }
`;

const NewsAndUpdatesModal = ({ onClose, ...modalProps }) => {
  return (
    <Modal onClose={onClose} width="576px" {...modalProps}>
      <ModalHeader>
        <Flex width="100%">
          <Flex>
            <Span pt={1}>
              <Image
                width={41}
                height={28}
                src="/static/images/updates-and-news-modal-icon.svg"
                alt="Updates and News Icon"
              />
            </Span>
            <P fontSize={['25px', '28px']} fontWeight="500" lineHeight="36px" color="black.900" margin="0px 16px">
              <FormattedMessage id="NewsAndUpdates.link.newsAndUpdates" defaultMessage="News and Updates" />
            </P>
          </Flex>
        </Flex>
      </ModalHeader>
      <hr />
      <ModalBody>
        <Query
          query={newsAndUpdatesQuery}
          variables={{ collectiveSlug: 'opencollective', onlyChangelogUpdates: true }}
          context={API_V2_CONTEXT}
        >
          {({ data, loading }) =>
            loading === false && data ? (
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
                        <FormattedMessage
                          id="NewsAndUpdates.link.giveFeedback"
                          defaultMessage="Read more & give Feedback"
                        />
                      </StyledLink>
                    </Flex>
                    <Flex pb={1}>
                      <HTMLContent color="black.800" mt={1} fontSize="16px" content={update.summary} />
                    </Flex>
                    <Flex pb={3}>
                      {update.summary.endsWith('...') && (
                        <StyledLink
                          onClick={onClose}
                          as={Link}
                          href={`/opencollective/updates/${update.slug}`}
                          fontSize="14px"
                          display="flex"
                        >
                          <FormattedMessage id="NewsAndUpdates.link.readMore" defaultMessage="Read more" />
                        </StyledLink>
                      )}
                    </Flex>
                  </Container>
                ))}
              </StyledCarousel>
            ) : (
              <Loading />
            )
          }
        </Query>
      </ModalBody>
      <ModalFooter isFullWidth>
        <Container display="flex">
          <Flex pt={1} width={1 / 2}>
            <StyledLink href="https://twitter.com/opencollect" openInNewTab color="black.700" display="flex" pt={3}>
              <Span pr={2}>
                <FormattedMessage id="NewsAndUpdates.link.twitterFollow" defaultMessage="Follow us" />
              </Span>
              <Span pt={0.5}>
                <Twitter size={17} color="#1153D6" />
              </Span>
            </StyledLink>
          </Flex>
          <Flex width={1 / 2} justifyContent="right">
            <Link onClick={onClose} href="/opencollective/updates">
              <StyledButton>
                <Span fontSize={['11px', '14px']}>
                  <FormattedMessage id="NewsAndUpdates.button.seeAllUpdates" defaultMessage="See all new updates" />
                </Span>
              </StyledButton>
            </Link>
          </Flex>
        </Container>
      </ModalFooter>
    </Modal>
  );
};

NewsAndUpdatesModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  router: PropTypes.object,
};

export default NewsAndUpdatesModal;
