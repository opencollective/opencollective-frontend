import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { defineMessages, FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { confettiFireworks } from '../../lib/confettis';
import { formatCurrency } from '../../lib/currency-utils';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledLink from '../StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { H1, P } from '../Text';

const messages = defineMessages({
  collectives: {
    id: 'pricingTable.row.collectives',
    defaultMessage: 'Collectives',
  },
  managed: {
    id: 'ManagedFunds',
    defaultMessage: 'Managed funds',
  },
  apply: {
    id: 'host.apply.create.btn',
    defaultMessage: 'Apply',
  },
  currency: {
    id: 'Currency',
    defaultMessage: 'Currency',
  },
  hostFee: {
    id: 'HostFee',
    defaultMessage: 'Host fee',
  },
  hostSince: {
    id: 'HostSince',
    defaultMessage: 'Host since',
  },
  cancel: {
    id: 'actions.cancel',
    defaultMessage: 'Cancel',
  },
  submit: {
    id: 'actions.submitApplication',
    defaultMessage: 'Submit application',
  },
  tosError: {
    id: 'acceptContributions.tosError',
    defaultMessage: "Please accept the host's terms of service.",
  },
});

const applyToHostMutation = gqlV2/* GraphQL */ `
  mutation ApplyToHost($collective: AccountReferenceInput!, $host: AccountReferenceInput!) {
    applyToHost(collective: $collective, host: $host) {
      id
      slug
      host {
        id
        slug
      }
    }
  }
`;

const HostCollectiveCard = ({ host, collective, onChange, ...props }) => {
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);
  const { formatMessage } = useIntl();

  const [applyToHost, { loading }] = useMutation(applyToHostMutation, {
    context: API_V2_CONTEXT,
  });

  const handleApplication = async () => {
    if (get(host, 'settings.tos') && !checked) {
      setError(formatMessage(messages.tosError));
      return;
    }
    try {
      await applyToHost({
        variables: {
          collective: { legacyId: collective.id },
          host: { id: host.id },
        },
      });
      Router.pushRoute('accept-financial-contributions', {
        slug: collective.slug,
        path: 'host',
        state: 'success',
      })
        .then(() => window.scrollTo(0, 0))
        .then(() => {
          confettiFireworks(5000, { zIndex: 3000 });
        });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setError(errorMsg);
    }
  };

  return (
    <Fragment>
      <StyledCollectiveCard collective={host} minWidth={250} height={350} position="relative" {...props}>
        <Container pl={3} flexShrink={1}>
          <Flex data-cy="caption" mb={2} alignItems="flex-end">
            <P fontSize="16px" fontWeight="bold">
              {host.totalHostedCollectives || 0}
            </P>
            <P ml={2} fontSize="12px">
              {formatMessage(messages.collectives)}
            </P>
          </Flex>
          <Flex data-cy="caption" mb={2} alignItems="flex-end">
            <P fontSize="16px" fontWeight="bold">
              {formatCurrency(host.stats.yearlyBudgetManaged.value * 100, host.currency, { precision: 0 })}
            </P>
            <P ml={2} fontSize="12px">
              {host.currency} {formatMessage(messages.managed)}
            </P>
          </Flex>
          <StyledButton
            buttonStyle="dark"
            mt={[2, 3]}
            mb={2}
            px={3}
            onClick={() => {
              setShow(true);
              onChange('chosenHost', host);
            }}
            data-cy="afc-host-apply-button"
          >
            {formatMessage(messages.apply)}
          </StyledButton>
        </Container>
      </StyledCollectiveCard>
      <Modal show={show} width="570px" onClose={() => setShow(false)}>
        <ModalHeader onClose={() => setShow(false)}>
          <Flex flexDirection="column" alignItems="flex-start" width="100%">
            <Avatar collective={host} radius={64} />
            <H1 fontSize="20px" color="black.900">
              {host.name}
            </H1>
            <Flex justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <P>{formatMessage(messages.hostSince)}</P>
                <P>
                  <FormattedDate value={host.createdAt} month="long" year="numeric" />
                </P>
              </Flex>
              <Flex flexDirection="column">
                <P fontSize="12px" color="black.500">
                  {formatMessage(messages.currency)}
                </P>
                <P fontSize="16px">{host.currency}</P>
              </Flex>
              <Flex flexDirection="column">
                <P>{formatMessage(messages.hostFee)}</P>
                <P>{host.hostFeePercent}%</P>
              </Flex>
            </Flex>
          </Flex>
        </ModalHeader>
        <ModalBody>
          <Fragment>
            {host.longDescription && <HTMLContent content={host.longDescription} />}
            {get(host, 'settings.tos') && (
              <Flex flexDirection="column" mx={1} my={4}>
                <StyledCheckbox
                  name="tos"
                  label={
                    <FormattedMessage
                      id="acceptContributions.tos.label"
                      defaultMessage="I agree with the {hostTosLink} of {hostName}."
                      values={{
                        hostTosLink: (
                          <StyledLink href={get(host, 'settings.tos')} openInNewTab>
                            <FormattedMessage id="tos" defaultMessage="terms of service" />
                          </StyledLink>
                        ),
                        hostName: host.name,
                      }}
                    />
                  }
                  required
                  checked={checked}
                  onChange={() => setChecked(true)}
                />
              </Flex>
            )}
            {error && (
              <MessageBox type="error" withIcon my={[1, 3]}>
                {error}
              </MessageBox>
            )}
          </Fragment>
        </ModalBody>
        <ModalFooter>
          <Flex justifyContent="flex-end" width="100%">
            <StyledButton
              buttonType="button"
              onClick={() => setShow(false)}
              buttonStyle="standard"
              mt={[2, 3]}
              mb={2}
              px={3}
            >
              {formatMessage(messages.cancel)}
            </StyledButton>
            <StyledButton
              onClick={() => handleApplication()}
              loading={loading}
              buttonStyle="dark"
              mt={[2, 3]}
              mb={2}
              ml={3}
              px={3}
              data-cy="afc-host-submit-button"
            >
              {formatMessage(messages.submit)}
            </StyledButton>
          </Flex>
        </ModalFooter>
      </Modal>
    </Fragment>
  );
};

HostCollectiveCard.propTypes = {
  host: PropTypes.object.isRequired,
  collective: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default HostCollectiveCard;
