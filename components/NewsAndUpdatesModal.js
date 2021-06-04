import React from 'react';
import PropTypes from 'prop-types';
import { Query } from '@apollo/client/react/components';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { fontSize } from 'styled-system';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import NextIllustration from './home/HomeNextIllustration';
import Container from './Container';
import { Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledCarousel from './StyledCarousel';
import StyledLink from './StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { Span } from './Text';

const Text = styled.p`
  position: static;
  left: 18.24%;
  right: 0%;
  top: 5%;
  bottom: 5%;

  font-family: Inter;
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  line-height: 36px;

  display: flex;
  align-items: center;
  letter-spacing: -0.008em;

  color: #141414;

  flex: none;
  order: 1;
  flex-grow: 0;
  margin: 0px 16px;
  ${fontSize}
`;

const newsAndUpdatesQuery = gqlV2/* GraphQL */ `
  query Update($collectiveSlug: String) {
    account(slug: $collectiveSlug) {
      updates {
        nodes {
          id
          publishedAt
          title
          html
        }
      }
    }
  }
`;

const goToUpdatePage = (router, event) => {
  event.preventDefault();
  return router.push('/opencollective/updates');
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
        <Query query={newsAndUpdatesQuery} variables={{ collectiveSlug: 'opencollective' }} context={API_V2_CONTEXT}>
          {({ data, loading }) =>
            loading === false && data ? (
              <StyledCarousel>
                {data.account.updates.nodes.map(update => (
                  <Flex width="100%" key={update.id} justifyContent="left">
                    <Text fontSize="20px">{update.title}</Text>
                    {/* {update.publishedAt}*/}
                    {/* {update.html}*/}
                  </Flex>
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
                goToUpdatePage(router, event);
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
  update: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  router: PropTypes.object,
};

export default NewsAndUpdatesModal;
