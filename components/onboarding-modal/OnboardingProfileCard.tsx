import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Avatar from '../../components/Avatar';
import StyledTag from '../../components/StyledTag';

import { Box, Flex } from '../Grid';
import StyledTooltip from '../StyledTooltip';

const Admin = styled(StyledTag).attrs({ variant: 'rounded-right' })``;

class OnboardingProfileCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    removeAdmin: PropTypes.func,
    isPending: PropTypes.bool,
  };

  render() {
    const { collective, removeAdmin, isPending } = this.props;
    const { name } = collective;

    const content = (
      <Admin
        closeButtonProps={
          removeAdmin
            ? {
                onClick: () => {
                  removeAdmin(collective);
                },
              }
            : null
        }
        data-cy="remove-user"
      >
        <Flex alignItems="center">
          <Avatar radius={16} collective={collective} />
          <Box fontSize="12px" ml={2} data-cy="name-of-admins">
            {name}
          </Box>
        </Flex>
      </Admin>
    );

    return (
      <Flex my={1} mr={2}>
        {isPending ? (
          <StyledTooltip
            content={() => <FormattedMessage id="onboarding.admins.pending" defaultMessage="Pending approval" />}
          >
            {content}
          </StyledTooltip>
        ) : (
          content
        )}
      </Flex>
    );
  }
}

export default OnboardingProfileCard;
