import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { Times } from '@styled-icons/fa-solid/Times';
import { createPortal } from 'react-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Popper } from 'react-popper';
import styled from 'styled-components';

import { formatErrorMessage, getErrorFromGraphqlException } from '../lib/errors';
import withViewport from '../lib/withViewport';

import { collectivePageQuery } from '../components/collective-page/graphql/queries';
import { tierPageQuery } from '../components/tier-page/graphql/queries';

import { MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD } from './contribute-cards/Contribute';
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
  mutation EditPublicMessage($FromCollectiveId: Int!, $CollectiveId: Int!, $message: String) {
    editPublicMessage(FromCollectiveId: $FromCollectiveId, CollectiveId: $CollectiveId, message: $message) {
      id
      publicMessage
      tier {
        id
      }
      collective {
        id
        slug
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

function EditPublicMessagePopup({ width, fromCollectiveId, collectiveId, cardRef, onClose, message, intl }) {
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
                  <FormattedMessage id="contribute.publicMessage" defaultMessage="Leave a public message (Optional)" />
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
                          FromCollectiveId: fromCollectiveId,
                          CollectiveId: collectiveId,
                          message: messageDraft ? messageDraft.trim() : null,
                        },
                        // Update cache after mutation
                        refetchQueries({ data: { editPublicMessage } }) {
                          const [member] = editPublicMessage;
                          const collectiveSlug = member.collective.slug;
                          const tier = member.tier;
                          const queries = [
                            {
                              query: collectivePageQuery,
                              variables: {
                                slug: collectiveSlug,
                                nbContributorsPerContributeCard: MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD,
                              },
                            },
                          ];
                          if (tier) {
                            queries.push({
                              query: tierPageQuery,
                              variables: { tierId: tier.id },
                            });
                          }
                          return queries;
                        },
                      });
                      onClose();
                    }}
                  >
                    <FormattedMessage id="button.submit" defaultMessage="Submit" />
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

EditPublicMessagePopup.defaultProps = {
  message: '',
};

EditPublicMessagePopup.propTypes = {
  fromCollectiveId: PropTypes.number.isRequired,
  collectiveId: PropTypes.number.isRequired,
  cardRef: PropTypes.shape({ current: PropTypes.object }).isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  intl: PropTypes.object,
  /** @ignore from withViewport */
  width: PropTypes.number,
};

export default withViewport(EditPublicMessagePopup, { withWidth: true });
