import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import Avatar from '../../components/Avatar';
import StyledTag from '../../components/StyledTag';
import StyledTooltip from '../../components/StyledTooltip';

const Admin = styled(StyledTag)`
  font-size: 14px;
  border-top-right-radius: 50px;
  border-bottom-right-radius: 50px;
  text-transform: none;
  display: flex;
  align-items: center;
`;

class OnboardingProfileCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    adminCollective: PropTypes.object,
    removeAdmin: PropTypes.func,
  };

  render() {
    const { collective, removeAdmin, adminCollective } = this.props;
    const { name, email } = collective;

    return (
      <Flex my={1} ml={2}>
        {/* for invited users email is null */}
        {email === null ? (
          <StyledTooltip
            content={() => <FormattedMessage id="onboarding.admins.pending" defaultMessage="Pending for approval" />}
          >
            <Admin
              closeButtonProps={{
                width: '1.5em',
                height: '1.5em',
                iconColor: 'black',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                display: 'flex',
                align: 'center',
                onClick: () => {
                  removeAdmin(collective);
                },
              }}
            >
              <Flex alignItems="center">
                <Avatar radius={15} collective={collective} />
                <Box fontSize="Caption" ml={2}>
                  {name}
                </Box>
              </Flex>
            </Admin>
          </StyledTooltip>
        ) : (
          <Admin
            closeButtonProps={
              collective.id !== adminCollective.id && {
                width: '1.5em',
                height: '1.5em',
                iconColor: 'black',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                display: 'flex',
                align: 'center',
                onClick: () => {
                  removeAdmin(collective);
                },
              }
            }
          >
            <Flex alignItems="center">
              <Avatar radius={15} collective={collective} />
              <Box fontSize="Caption" ml={2}>
                {name}
              </Box>
            </Flex>
          </Admin>
        )}
      </Flex>
    );
  }
}

export default OnboardingProfileCard;
