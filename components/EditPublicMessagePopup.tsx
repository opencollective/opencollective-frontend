import React, { useState } from 'react';
import type { DocumentNode } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { Times } from '@styled-icons/fa-solid/Times';
import { createPortal } from 'react-dom';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Popper } from 'react-popper';
import { styled } from 'styled-components';

import { formatErrorMessage, getErrorFromGraphqlException } from '../lib/errors';
import { API_V1_CONTEXT, gql } from '../lib/graphql/helpers';
import withViewport from '../lib/withViewport';

import { collectivePageQuery } from '../components/collective-page/graphql/queries';
import { tierPageQuery } from '../components/tier-page/graphql/queries';

import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from './contribute-cards/constants';
import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import { fadeIn } from './StyledKeyframes';
import { Span } from './Text';

/** Pop-up for editing the public message */
const EditPublicMessagePopupContainer = styled.div`
  position: absolute;
  padding: 8px;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  animation: ${fadeIn} 0.3s ease-in-out;
  z-index: 1;
  width: 275px;
`;

const Arrow = styled('div')`
  position: absolute;
  width: 3em;
  height: 3em;
  &[data-placement*='bottom'] {
    top: 0;
    left: 0;
    margin-top: -0.9em;
    width: 3em;
    height: 1em;
    &::before {
      border-width: 0 1.5em 1em 1.5em;
      border-color: transparent transparent #ffffff transparent;
      filter: drop-shadow(0px -3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &[data-placement*='top'] {
    bottom: 0;
    left: 0;
    margin-bottom: -0.9em;
    width: 3em;
    height: 1em;
    &::before {
      border-width: 1em 1.5em 0 1.5em;
      border-color: #ffffff transparent transparent transparent;
      filter: drop-shadow(0px 3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &[data-placement*='right'] {
    left: 0;
    margin-left: -0.9em;
    height: 3em;
    width: 1em;
    &::before {
      border-width: 1.5em 1em 1.5em 0;
      border-color: transparent #ffffff transparent transparent;
      filter: drop-shadow(-4px 3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &[data-placement*='left'] {
    right: 0;
    margin-right: -0.9em;
    height: 3em;
    width: 1em;
    &::before {
      border-width: 1.5em 0 1.5em 1em;
      border-color: transparent transparent transparent #ffffff;
      filter: drop-shadow(4px 3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &::before {
    content: '';
    margin: auto;
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
  }
`;

const editPublicMessageMutation = gql`
  mutation EditPublicMessage(
    $fromAccount: AccountReferenceInput!
    $toAccount: AccountReferenceInput!
    $message: String
  ) {
    editPublicMessage(fromAccount: $fromAccount, toAccount: $toAccount, message: $message) {
      id
      publicMessage
      tier {
        id
        legacyId
      }
    }
  }
`;

const messages = defineMessages({
  publicMessagePlaceholder: {
    id: 'contribute.publicMessage.placeholder',
    defaultMessage: 'Motivate others to contribute in 140 characters :) ...',
  },
});

const PUBLIC_MESSAGE_MAX_LENGTH = 140;
const REACT_POPPER_MODIFIERS = [
  {
    name: 'flip',
    options: {
      fallbackPlacements: ['right', 'bottom', 'top'],
      padding: { right: 100 },
    },
  },
];

type EditPublicMessagePopupProps = {
  /** Injected by `withViewport` */
  width?: number;
  fromCollectiveId: number;
  collectiveId: number;
  /** Slug of the collective, used to refresh its page after saving */
  collectiveSlug?: string;
  cardRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  message?: string;
  intl?: IntlShape;
};

function EditPublicMessagePopup({
  width,
  fromCollectiveId,
  collectiveId,
  collectiveSlug,
  cardRef,
  onClose,
  message = '',
  intl,
}: EditPublicMessagePopupProps) {
  const [messageDraft, setMessageDraft] = useState(message || '');

  // Can't be rendered SSR
  if (typeof window === 'undefined' || !cardRef.current) {
    return null;
  }

  return createPortal(
    <Mutation mutation={editPublicMessageMutation}>
      {(submitMessage, { loading, error }) => (
        <Popper
          referenceElement={cardRef.current}
          placement={width < 780 ? 'bottom' : 'right'}
          modifiers={REACT_POPPER_MODIFIERS}
        >
          {({ ref, style, placement, arrowProps }) => (
            <EditPublicMessagePopupContainer
              data-cy="EditPublicMessagePopup"
              ref={ref}
              style={style}
              data-placement={placement}
            >
              <Flex justifyContent="flex-end">
                <Times size="1em" color="#a2a2a2" cursor="pointer" onClick={onClose} />
              </Flex>
              <Flex flexDirection="column" p={2}>
                <Span fontSize="14px" color="black.600" mb={2}>
                  <FormattedMessage id="contribute.publicMessage" defaultMessage="Leave a public message (optional)" />
                </Span>

                <StyledInput
                  name="publicMessage"
                  as="textarea"
                  px={10}
                  py={10}
                  width="100%"
                  height={112}
                  fontSize="14px"
                  style={{ resize: 'none' }}
                  placeholder={intl.formatMessage(messages.publicMessagePlaceholder)}
                  value={messageDraft}
                  maxLength={PUBLIC_MESSAGE_MAX_LENGTH}
                  onChange={e => setMessageDraft(e.target.value)}
                  disabled={loading}
                />
                {error && (
                  <Span color="red.500" fontSize="12px" mt={2}>
                    {formatErrorMessage(intl, getErrorFromGraphqlException(error))}
                  </Span>
                )}
                <Box m="0 auto">
                  <StyledButton
                    data-cy="EditPublicMessagePopup_SubmitButton"
                    buttonSize="small"
                    fontWeight="bold"
                    px={4}
                    mt={3}
                    loading={loading}
                    onClick={async () => {
                      await submitMessage({
                        variables: {
                          // The contributor cards only have the legacy ids of both accounts
                          fromAccount: { legacyId: fromCollectiveId },
                          toAccount: { legacyId: collectiveId },
                          message: messageDraft ? messageDraft.trim() : null,
                        },
                        // Refresh the collective and tier pages, which show the contributors with their message.
                        // These page queries are still on v1.
                        refetchQueries({ data: { editPublicMessage } }) {
                          const queries: Array<{
                            query: DocumentNode;
                            context: typeof API_V1_CONTEXT;
                            variables: Record<string, unknown>;
                          }> = [];
                          if (collectiveSlug) {
                            queries.push({
                              query: collectivePageQuery,
                              context: API_V1_CONTEXT,
                              variables: {
                                slug: collectiveSlug,
                                nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
                              },
                            });
                          }
                          const tierLegacyId = editPublicMessage?.tier?.legacyId;
                          if (tierLegacyId) {
                            queries.push({
                              query: tierPageQuery,
                              context: API_V1_CONTEXT,
                              variables: { tierId: tierLegacyId },
                            });
                          }
                          return queries;
                        },
                      });
                      onClose();
                    }}
                  >
                    <FormattedMessage id="submit" defaultMessage="Submit" />
                  </StyledButton>
                </Box>
              </Flex>
              <Arrow {...arrowProps} data-placement={placement} />
            </EditPublicMessagePopupContainer>
          )}
        </Popper>
      )}
    </Mutation>,
    document.body,
  );
}

export default withViewport(EditPublicMessagePopup, { withWidth: true });
