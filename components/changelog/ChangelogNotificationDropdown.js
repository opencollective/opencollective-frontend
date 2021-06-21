import React from 'react';
import PropTypes from 'prop-types';
import { Times } from '@styled-icons/fa-solid/Times';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import { DropdownArrow, DropdownContent } from '../StyledDropdown';
import { P } from '../Text';

const ChangeLogNotificationDropdownArrow = styled(DropdownArrow)`
  display: block;
  right: 18px;
  margin-top: 3px;
  &::before {
    border-color: transparent transparent #ffffc2 transparent;
  }
`;

const ChangeLogNotificationDropdownContent = styled(DropdownContent)`
  display: block;
  right: 13px;
  margin-top: 10px;
  background: #ffffc2;
`;

const CloseIcon = styled(Times)`
  font-size: 12px;
  width: 15px;
  height: 15px;
  color: #76777a;
  cursor: pointer;
`;

const ChangelogNotificationDropdown = onClose => {
  return (
    <React.Fragment>
      <ChangeLogNotificationDropdownArrow />
      <ChangeLogNotificationDropdownContent>
        <Box as="ul" p={20} m={0} minWidth={184}>
          <Flex>
            <P fontSize="14px" fontWeight="700" color="black.800" mb={3} mr={3}>
              <FormattedMessage id="ChangelogNotification.firstLine" defaultMessage="We have new stuff for you!" />
            </P>
            <CloseIcon onClick={onClose} />
          </Flex>
          <P fontSize="14px" color="black.800">
            <FormattedMessage
              id="ChangelogNotification.secondLine"
              defaultMessage="Click on the {image} to take a look"
              values={{
                image: <Image src="/static/images/flame-red.svg" width={10.55} height={15} alt="Flame Image" />,
              }}
            />
          </P>
        </Box>
      </ChangeLogNotificationDropdownContent>
    </React.Fragment>
  );
};

ChangelogNotificationDropdown.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ChangelogNotificationDropdown;
