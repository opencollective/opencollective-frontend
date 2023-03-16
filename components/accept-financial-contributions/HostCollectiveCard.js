import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { confettiFireworks } from '../../lib/confettis';

import ApplyToHostModal from '../ApplyToHostModal';
import Container from '../Container';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCollectiveCard from '../StyledCollectiveCard';
import { P } from '../Text';

const messages = defineMessages({
  collectives: {
    id: 'Collectives',
    defaultMessage: 'Collectives',
  },
  apply: {
    id: 'Apply',
    defaultMessage: 'Apply',
  },
});

const HostCollectiveCard = ({ host, collective, onChange, ...props }) => {
  const [showModal, setShowModal] = useState(false);
  const { formatMessage } = useIntl();

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
          <StyledButton
            buttonStyle="dark"
            mt={[2, 3]}
            mb={2}
            px={3}
            onClick={() => {
              setShowModal(true);
              onChange('chosenHost', host);
            }}
            data-cy="afc-host-apply-button"
          >
            {formatMessage(messages.apply)}
          </StyledButton>
        </Container>
      </StyledCollectiveCard>
      {showModal && (
        <ApplyToHostModal
          hostSlug={host.slug}
          collective={collective}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            return props.router
              .push(`${collective.slug}/accept-financial-contributions/host/success`)
              .then(() => window.scrollTo(0, 0))
              .then(() => {
                confettiFireworks(5000, { zIndex: 3000 });
              });
          }}
        />
      )}
    </Fragment>
  );
};

HostCollectiveCard.propTypes = {
  host: PropTypes.object.isRequired,
  collective: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  router: PropTypes.object,
};

export default withRouter(HostCollectiveCard);
