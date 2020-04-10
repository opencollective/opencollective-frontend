import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedDate, useIntl, defineMessages, FormattedMessage } from 'react-intl';
import { graphql } from '@apollo/react-hoc';
import { get } from 'lodash';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { getCurrencySymbol } from '../../lib/utils';
import { confettiFireworks } from '../../lib/confettis';
import { Router } from '../../server/pages';

import Container from '../Container';
import { P, H1 } from '../Text';
import StyledButton from '../StyledButton';
import StyledCollectiveCard from '../StyledCollectiveCard';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../StyledModal';
import Avatar from '../Avatar';
import HTMLContent from '../HTMLContent';
import MessageBox from '../MessageBox';
import StyledCheckbox from '../StyledCheckbox';
import ExternalLink from '../ExternalLink';

const messages = defineMessages({
  collectives: {
    id: 'pricingTable.row.collectives',
    defaultMessage: 'Collectives',
  },
  contributors: {
    id: 'ContributorsFilter.Financial',
    defaultMessage: 'Financial contributors',
  },
  budget: {
    id: 'YearlyBudget',
    defaultMessage: 'Yearly budget',
  },
  apply: {
    id: 'host.apply.create.btn',
    defaultMessage: 'Apply',
  },
  currency: {
    id: 'collective.currency.label',
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

const HostCollectiveCard = ({ host, collective, onChange, ...props }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);
  const { formatMessage } = useIntl();

  const date = new Date(host.createdAt);
  const name = host.name;

  const handleApplication = async () => {
    if (get(host, 'settings.tos') && !checked) {
      setError(formatMessage(messages.tosError));
      return;
    }
    setLoading(true);
    const collectiveInput = {
      legacyId: collective.id,
    };
    const hostInput = {
      legacyId: host.legacyId,
    };
    try {
      await props.applyToHost(collectiveInput, hostInput);
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
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <StyledCollectiveCard collective={host} minWidth={250} height={360} position="relative" {...props}>
        <Container pl={3} flexShrink={1}>
          <Flex data-cy="caption" mb={2} alignItems="flex-end">
            <P fontSize="LeadParagraph" fontWeight="bold">
              {host.totalHostedCollectives}
            </P>
            <P ml={2} fontSize="Caption">
              {formatMessage(messages.collectives)}
            </P>
          </Flex>
          <Flex data-cy="caption" mb={2} alignItems="flex-end">
            <P fontSize="LeadParagraph" fontWeight="bold">
              {host.members.nodes.length}
            </P>
            <P ml={2} fontSize="Caption">
              {formatMessage(messages.contributors)}
            </P>
          </Flex>
          <Flex data-cy="caption" mb={2} alignItems="flex-end">
            <P fontSize="LeadParagraph" fontWeight="bold">
              {getCurrencySymbol(host.currency)}
              {host.stats.yearlyBudget.value}
            </P>
            <P ml={2} fontSize="Caption">
              {host.currency} {formatMessage(messages.budget)}
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
          >
            {formatMessage(messages.apply)}
          </StyledButton>
        </Container>
      </StyledCollectiveCard>
      <Modal show={show} width="570px" onClose={() => setShow(false)}>
        <ModalHeader onClose={() => setShow(false)}>
          <Flex flexDirection="column" alignItems="flex-start" width="100%">
            <Avatar collective={host} radius={64} />
            <H1 fontSize="H5" color="black.900">
              {host.name}
            </H1>
            <Flex justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <P>{formatMessage(messages.hostSince)}</P>
                <P>
                  <FormattedDate value={date} month="long" year="numeric" />
                </P>
              </Flex>
              <Flex flexDirection="column">
                <P fontSize="Caption" color="black.500">
                  {formatMessage(messages.currency)}
                </P>
                <P fontSize="LeadParagraph">{host.currency}</P>
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
            <HTMLContent content={host.longDescription} />
            {get(host, 'settings.tos') && (
              <Flex flexDirection="column" mx={1} my={4}>
                <StyledCheckbox
                  name="tos"
                  label={
                    <FormattedMessage
                      id="acceptContributions.tos.label"
                      defaultMessage="I agree with the {hostTosLink} of {name}."
                      values={{
                        hostTosLink: (
                          <ExternalLink href={get(host, 'settings.tos')} openInNewTab>
                            <FormattedMessage id="tos" defaultMessage="terms of service" />
                          </ExternalLink>
                        ),
                        name: name,
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
                {error.includes('GraphQL error: ') ? error.replace('GraphQL error: ', 'Error: ') : error}
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
  applyToHost: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

const applyToHostMutation = gqlV2`
mutation applyToHost($collective: AccountReferenceInput!, $host: AccountReferenceInput!) {
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

const addMutation = graphql(applyToHostMutation, {
  options: {
    context: API_V2_CONTEXT,
  },
  props: ({ mutate }) => ({
    applyToHost: async (collectiveInput, hostInput) => {
      return await mutate({ variables: { collective: collectiveInput, host: hostInput } });
    },
  }),
});

export default addMutation(HostCollectiveCard);
