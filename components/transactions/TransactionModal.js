import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/react-hooks';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import ExpenseSummary from '../expenses/ExpenseSummary';
import InvoiceDownloadLink from '../expenses/InvoiceDownloadLink';
import { Box, Flex } from '../Grid';
import Modal from '../StyledModal';
import StyledRoundButton from '../StyledRoundButton';
import StyledTooltip from '../StyledTooltip';

const HostFieldsFragment = gqlV2`
  fragment HostFieldsFragment on Host {
    id
    name
    slug
    type
    expensePolicy
    website
    settings
    connectedAccounts {
      id
      service
    }
    location {
      address
      country
    }
    plan {
      transferwisePayouts
      transferwisePayoutsLimit
    }
  }
`;
const transactionModalQuery = gqlV2`
  query ExpensePage($legacyExpenseId: Int!) {
    expense(expense: { legacyId: $legacyExpenseId }) {
      id
      legacyId
      description
      currency
      type
      status
      privateMessage
      tags
      amount
      createdAt
      invoiceInfo
      requiredLegalDocuments
      items {
        id
        incurredAt
        description
        amount
        url
      }
      attachedFiles {
        id
        url
      }
      payee {
        id
        slug
        name
        type
        isAdmin
        location {
          address
          country
        }
        payoutMethods {
          id
          type
          name
          data
          isSaved
        }
      }
      payeeLocation {
        address
        country
      }
      createdByAccount {
        id
        slug
        name
        type
        imageUrl
      }
      account {
        id
        slug
        name
        type
        imageUrl
        description
        settings
        twitterHandle
        currency
        expensePolicy
        expensesTags {
          id
          tag
        }
        location {
          address
          country
        }
        ... on Organization {
          id
          isHost
          balance
          host {
            ...HostFieldsFragment
          }
        }

        ... on Collective {
          id
          isApproved
          balance
          host {
            ...HostFieldsFragment
          }
        }
        ... on Fund {
          id
          isApproved
          balance
          host {
            ...HostFieldsFragment
          }
        }
        ... on Event {
          id
          isApproved
          balance
          host {
            ...HostFieldsFragment
          }
          parent {
            id
            slug
            name
            type
            imageUrl
          }
        }
        ... on Project {
          id
          isApproved
          balance
          host {
            ...HostFieldsFragment
          }
          parent {
            id
            slug
            name
            type
            imageUrl
          }
        }
      }
      payoutMethod {
        id
        type
        data
        isSaved
      }
      comments(limit: 300) {
        nodes {
          id
        }
      }
      permissions {
        canEdit
        canDelete
        canSeeInvoiceInfo
        canApprove
        canUnapprove
        canReject
        canPay
        canMarkAsUnpaid
        canComment
      }
      activities {
        id
        type
        createdAt
        individual {
          id
          type
          slug
          name
          imageUrl
        }
      }
    }
  }
  ${HostFieldsFragment}
`;

const ArrowRightIcon = styled(ArrowRight)`
  margin-left: 4px;
`;

const TransactionModal = ({ expense, toAccount, uuid, onClose, show, canDownloadInvoice }) => {
  const { data, loading } = useQuery(transactionModalQuery, {
    variables: { legacyExpenseId: expense.legacyId },
    context: API_V2_CONTEXT,
  });

  return (
    <Modal {...{ onClose, show }} width="728px" maxWidth="100%" overflowY={['auto', 'initial']}>
      <Flex flexDirection="column">
        <Box>
          <ExpenseSummary
            isLoading={loading || !data}
            expense={!loading && data?.expense}
            host={!loading && data?.expense?.account?.host}
            borderless
          />
        </Box>
        <Flex mt="10px" pt="16px" borderTop="1px solid" borderColor="black.300">
          <Box>
            <StyledTooltip
              content={
                <span>
                  <FormattedMessage id="Transactions.Modal.ExpenseLink" defaultMessage="Go to expense page" />
                  <ArrowRightIcon size="17px" />
                </span>
              }
              delayHide={0}
            >
              <a href={`/${data?.expense.account.slug}/expenses/${data?.expense.legacyId}`}>
                <StyledRoundButton size="32px">
                  <IconLink size="16px" />
                </StyledRoundButton>
              </a>
            </StyledTooltip>
          </Box>
          {canDownloadInvoice && (
            <Box ml={1}>
              <StyledTooltip
                content={<FormattedMessage id="DownloadInvoice" defaultMessage="Download invoice" />}
                delayHide={0}
              >
                <InvoiceDownloadLink type="transaction" transactionUuid={uuid} toCollectiveSlug={toAccount.slug}>
                  {({ loading, download }) => (
                    <StyledRoundButton size="32px" loading={loading} onClick={download}>
                      <IconDownload size="16px" />
                    </StyledRoundButton>
                  )}
                </InvoiceDownloadLink>
              </StyledTooltip>
            </Box>
          )}
        </Flex>
      </Flex>
    </Modal>
  );
};

TransactionModal.propTypes = {
  /** If true, a button to download invoice will be displayed when possible */
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
  }),
  uuid: PropTypes.string,
  toAccount: PropTypes.shape({
    slug: PropTypes.string,
  }),
  canDownloadInvoice: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default TransactionModal;
