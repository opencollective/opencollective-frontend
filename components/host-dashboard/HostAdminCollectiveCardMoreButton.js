import React from 'react';
import PropTypes from 'prop-types';
import { DotsVerticalRounded } from '@styled-icons/boxicons-regular/DotsVerticalRounded';
import { Pause } from '@styled-icons/feather/Pause';
import { Play } from '@styled-icons/feather/Play';
import { FormattedMessage, useIntl } from 'react-intl';

import { Flex } from '../Grid';
import MenuPopover from '../MenuPopover';
import StyledButton from '../StyledButton';
import StyledRoundButton from '../StyledRoundButton';
import { Span } from '../Text';

import FreezeAccountModal from './FreezeAccountModal';

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
          <FormattedMessage defaultMessage="Unfreeze Collective" />
        ) : (
          <FormattedMessage defaultMessage="Freeze Collective" />
        )}
      </Span>
    </StyledButton>
  );
};

FreezeAccountButton.propTypes = {
  collective: PropTypes.object,
  onClick: PropTypes.func,
};

const HostAdminCollectiveCardMoreButton = ({ collective }) => {
  const intl = useIntl();
  const [hasFreezeModal, setHasFreezeModal] = React.useState(false);
  return (
    <React.Fragment>
      <MenuPopover
        content={({ onClose }) => (
          <Flex flexDirection="column">
            <FreezeAccountButton
              collective={collective}
              onClick={() => {
                setHasFreezeModal(true);
                onClose();
              }}
            />
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
    </React.Fragment>
  );
};

HostAdminCollectiveCardMoreButton.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default HostAdminCollectiveCardMoreButton;
