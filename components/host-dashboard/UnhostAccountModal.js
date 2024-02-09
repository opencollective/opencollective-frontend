import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { Label, P } from '../Text';
import { useToast } from '../ui/useToast';

const unhostAccountMutation = gql`
  mutation UnhostAccount($account: AccountReferenceInput!, $message: String) {
    removeHost(account: $account, message: $message) {
      id
      slug
      name
      ... on AccountWithHost {
        host {
          id
        }
      }
    }
  }
`;

const UnhostAccountModal = ({ collective, host, ...props }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [unhostAccount, { loading }] = useMutation(unhostAccountMutation, {
    context: API_V2_CONTEXT,
    variables: {
      account: {
        id: collective.id,
      },
      message,
    },
    refetchQueries: ['HostDashboardHostedCollectives'],
    awaitRefetchQueries: true,
  });

  return (
    <StyledModal maxWidth={432} {...props}>
      <CollectiveModalHeader collective={collective} mb={3} />
      <ModalBody>
        <div>
          <P fontSize="16px" fontWeight="700" lineHeight="24px" color="red.900" mb={2}>
            <FormattedMessage
              defaultMessage="Are you sure you want to un-host {collectiveName}?"
              values={{ collectiveName: collective.name }}
            />
          </P>
          <P fontSize="14px" lineHeight="20px" color="black.700" mb={2}>
            <FormattedMessage
              defaultMessage="{fiscalHostName} will no longer be the Fiscal Host for this Collective. Un-hosting this Collective means no longer holding funds for them, neither managing tax compliance and accounting."
              values={{ fiscalHostName: host.name }}
            />
          </P>
          {collective.stats.balance.valueInCents > 0 && (
            <MessageBox type="warning" mb={2}>
              <FormattedMessage
                defaultMessage="The Collective's balance must be zero to un-host, including its Events or Projects. There is a remaining balance of {collectiveBalanceAmount}. You can pay out these funds by <Link>processing expenses.</Link>"
                values={{
                  collectiveBalanceAmount: formatCurrency(
                    collective.stats.balance.valueInCents,
                    collective.stats.balance.currency,
                    { locale: intl.locale },
                  ),
                  Link: value => (
                    <StyledLink
                      color="black.800"
                      href="https://docs.opencollective.com/help/expenses-and-getting-paid/submitting-expenses"
                      textDecoration="underline"
                      openInNewTab
                    >
                      {value}
                    </StyledLink>
                  ),
                }}
              />
            </MessageBox>
          )}
          <Label
            htmlFor="unhost-account-message"
            fontSize="16px"
            fontWeight="700"
            lineHeight="24px"
            color="black.800.900"
            mb="6px"
          >
            <FormattedMessage defaultMessage="Include a message to the Collective admins (Optional)" />
          </Label>
          <StyledTextarea
            id="unhost-account-message"
            width="100%"
            minHeight={126}
            maxHeight={300}
            onChange={e => setMessage(e.target.value)}
            value={message}
            fontSize="13px"
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent="center">
          <StyledButton
            buttonStyle={'danger'}
            minWidth={90}
            disabled={collective.stats.balance.valueInCents > 0}
            loading={loading}
            onClick={async () => {
              try {
                await unhostAccount();
                const successMsgArgs = { accountName: collective.name, accountSlug: collective.slug };
                toast({
                  variant: 'success',
                  message: intl.formatMessage(
                    { defaultMessage: '{accountName} (@{accountSlug}) has been un-hosted' },
                    successMsgArgs,
                  ),
                });
                props.onClose();
                props.onSuccess?.();
              } catch (e) {
                toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              }
            }}
          >
            <FormattedMessage defaultMessage="Un-host Collective" />
          </StyledButton>
          <StyledButton ml={3} minWidth={120} onClick={props.onClose} disabled={loading}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

UnhostAccountModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  collective: PropTypes.shape({
    id: PropTypes.string,
    hostFeePercent: PropTypes.number,
    isFrozen: PropTypes.bool,
    settings: PropTypes.object,
    parent: PropTypes.object,
    type: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    stats: PropTypes.shape({
      balance: PropTypes.shape({
        valueInCents: PropTypes.number,
        currency: PropTypes.string,
      }),
    }),
  }).isRequired,
  host: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
};

export default UnhostAccountModal;
