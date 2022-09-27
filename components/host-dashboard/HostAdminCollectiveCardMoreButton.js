import React from 'react';
import PropTypes from 'prop-types';
import { DotsVerticalRounded } from '@styled-icons/boxicons-regular/DotsVerticalRounded';
import { Unlink } from '@styled-icons/boxicons-regular/Unlink';
import { Pause } from '@styled-icons/feather/Pause';
import { Play } from '@styled-icons/feather/Play';
import { FormattedMessage, useIntl } from 'react-intl';

import { Flex } from '../Grid';
import MenuPopover from '../MenuPopover';
import StyledButton from '../StyledButton';
import StyledRoundButton from '../StyledRoundButton';
import { Span } from '../Text';

import FreezeAccountModal from './FreezeAccountModal';
import UnhostAccountModal from './UnhostAccountModal';

const FreezeAccountButton = ({ collective, onClick }) => {
  return (
    <StyledButton
      isBorderless
      buttonStyle={collective.isFrozen ? 'standard' : 'dangerSecondary'}
      onClick={onClick}
      borderRadius={0}
    >
      {collective.isFrozen ? <Play size={18} color="#75777A" /> : <Pause size={16} />}
      <Span ml={3} fontSize="14px" lineHeight="20px" css={{ verticalAlign: 'middle' }}>
        {collective.isFrozen ? (
          <FormattedMessage defaultMessage="Unfreeze" />
        ) : (
          <FormattedMessage defaultMessage="Freeze" />
        )}
      </Span>
    </StyledButton>
  );
};

FreezeAccountButton.propTypes = {
  collective: PropTypes.object,
  onClick: PropTypes.func,
};

const UnhostAccountButton = ({ onClick }) => {
  return (
    <StyledButton
      isBorderless
      buttonStyle={'dangerSecondary'}
      onClick={onClick}
      borderRadius={0}
      width="100%"
      display="flex"
    >
      <Unlink size={18} />
      <Span ml={3} fontSize="14px" lineHeight="20px" css={{ verticalAlign: 'middle' }}>
        <FormattedMessage defaultMessage="Un-host" />
      </Span>
    </StyledButton>
  );
};

UnhostAccountButton.propTypes = {
  onClick: PropTypes.func,
};

const HostAdminCollectiveCardMoreButton = ({ collective, host }) => {
  const intl = useIntl();
  const [hasFreezeModal, setHasFreezeModal] = React.useState(false);
  const [hasUnhostModal, setHasUnhostModal] = React.useState(false);
  return (
    <React.Fragment>
      <MenuPopover
        content={({ onClose }) => (
          <Flex flexDirection="column" alignItems="start">
            <FreezeAccountButton
              collective={collective}
              onClick={() => {
                setHasFreezeModal(true);
                onClose();
              }}
            />
            {['development', 'staging', 'e2e', 'ci'].includes(process.env.OC_ENV) && (
              <UnhostAccountButton
                onClick={() => {
                  setHasUnhostModal(true);
                  onClose();
                }}
              />
            )}
          </Flex>
        )}
      >
        {btnProps => (
          <StyledRoundButton size={32} title={intl.formatMessage({ defaultMessage: 'More options' })} {...btnProps}>
            <DotsVerticalRounded size={18} color="#75777A" />
          </StyledRoundButton>
        )}
      </MenuPopover>
      {hasFreezeModal && <FreezeAccountModal collective={collective} onClose={() => setHasFreezeModal(false)} />}
      {hasUnhostModal && (
        <UnhostAccountModal collective={collective} host={host} onClose={() => setHasUnhostModal(false)} />
      )}
    </React.Fragment>
  );
};

HostAdminCollectiveCardMoreButton.propTypes = {
  collective: PropTypes.object.isRequired,
  host: PropTypes.object.isRequired,
};

export default HostAdminCollectiveCardMoreButton;
