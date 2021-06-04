import React from 'react';
import PropTypes from 'prop-types';
import { Query } from '@apollo/client/react/components';
import { useRouter } from 'next/router';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { fontSize, margin } from 'styled-system';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import NextIllustration from './home/HomeNextIllustration';
import Container from './Container';
import { Flex } from './Grid';
import HTMLContent from './HTMLContent';
import StyledButton from './StyledButton';
import StyledCarousel from './StyledCarousel';
import StyledLink from './StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { Span } from './Text';

const Text = styled.p`
  font-family: Inter;
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  line-height: 36px;
  color: #141414;
  margin: 0px 16px;
  ${margin}
  ${fontSize}
`;

const PublishedDate = styled(Container)`
  font-family: Inter;
  font-style: normal;
  font-weight: normal;
  font-size: 13px;
  line-height: 20px;
  color: #4e5052;
`;

const newsAndUpdatesQuery = gqlV2/* GraphQL */ `
  query Update($collectiveSlug: String, $onlyChangelogUpdates: Boolean) {
    account(slug: $collectiveSlug) {
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

const goToUpdatePage = (router, url, event) => {
  event.preventDefault();
  return router.push(url);
};

const NewsAndUpdatesModal = ({ onClose, ...modalProps }) => {
  const router = useRouter();

  return (
    <Modal onClose={onClose} width="576px" {...modalProps}>
      <ModalHeader>
        <Flex width="100%">
          <Flex>
            <Span pt={1}>
              <NextIllustration
                width={41}
                height={28}
                src="/static/images/updates-and-news-modal-icon.svg"
                alt="Updates and News Icon"
              />
            </Span>
            <Text fontSize={['25px', '28px']}>News and Updates</Text>
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
                    <PublishedDate>
                      <FormattedDate value={update.publishedAt} day="numeric" month="long" year="numeric" />
                    </PublishedDate>
                    <Flex>
                      <Span paddingTop="10px">
                        <NextIllustration
                          width={12}
                          height={12}
                          src="/static/images/news-and-updates-ellipse.svg"
                          alt="News and Updates Ellipse"
                        />
                      </Span>
                      <Text fontSize="20px" margin="0px 12px">
                        {update.title}
                      </Text>
                    </Flex>
                    <Flex pt={2} pb={3}>
                      <StyledLink
                        onClick={event => goToUpdatePage(router, `/opencollective/updates/${update.slug}`, event)}
                        color="#1153D6"
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
                      <HTMLContent color="#313233" mt={1} fontSize="16px" content={update.summary} />
                    </Flex>
                    <Flex pb={3}>
                      {update.summary.slice(update.summary.length - 3) === '...' && (
                        <StyledLink
                          onClick={event => goToUpdatePage(router, `/opencollective/updates/${update.slug}`, event)}
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
            ) : null
          }
        </Query>
      </ModalBody>
      <ModalFooter isFullWidth>
        <Container display="flex">
          <Flex pt={1} width={1 / 2}>
            <StyledLink href="https://twitter.com/opencollect" openInNewTab color="#4E5052" display="flex" pt={3}>
              <Span pr={2}>
                <FormattedMessage id="NewsAndUpdates.link.twitterFollow" defaultMessage="Follow us" />
              </Span>
              <Span pt={0.5}>
                <NextIllustration
                  width={16}
                  height={14}
                  src="/static/images/twitter-icon-blue.svg"
                  alt="Updates and News Icon"
                />
              </Span>
            </StyledLink>
          </Flex>
          <Flex width={1 / 2} justifyContent="right">
            <StyledButton
              onClick={event => {
                onClose();
                goToUpdatePage(router, '/opencollective/updates', event);
              }}
            >
              <Span fontSize={['11px', '14px']}>
                <FormattedMessage id="NewsAndUpdates.button.seeAllUpdates" defaultMessage="See all new updates" />
              </Span>
            </StyledButton>
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
