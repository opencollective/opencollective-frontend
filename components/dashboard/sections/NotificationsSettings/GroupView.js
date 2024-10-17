import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../../../Grid';
import StyledButton from '../../../StyledButton';
import StyledLink from '../../../StyledLink';
import { P } from '../../../Text';

import CollectiveSettings from './CollectiveSettings';

const CollectiveContainer = styled(Flex)`
  border: 1px solid rgba(50, 51, 52, 0.1);
`;

const GroupView = ({ accounts, title, advancedSettings, roleLabel }) => {
  const router = useRouter();
  // Return user to parent /dashboard/user/notifications page by removing the group name from the end of the URL
  const handleBack = () => router.push(`/${router.asPath.split('/').slice(1, 4).join('/')}`);

  return (
    <Box>
      <P color="blue.800" fontSize="13px" fontWeight="500" lineHeight="16px" mb={4}>
        <StyledLink textDecoration="underline" color="inherit" onClick={handleBack}>
          <FormattedMessage id="NotificationsSettings.Title" defaultMessage="Notification Settings" />
        </StyledLink>{' '}
        &gt; {title}
      </P>
      <P fontSize="24px" fontWeight="700" lineHeight="32px" mb={3}>
        {title}
      </P>
      <P lineHeight="20px" letterSpacing="0px">
        <FormattedMessage
          id="NotificationsSettings.Descripion"
          defaultMessage="We will always let you know about important changes, but you can customize other settings here. Manage email notifications for your individual profile as well as the collectives and organizations you are part of."
        />
      </P>
      <Flex mt={4} flexDirection="column">
        {accounts.map(account => (
          <CollectiveContainer key={account.id} mb={24} p={24} flexDirection="column">
            <CollectiveSettings account={account} advancedSettings={advancedSettings} roleLabel={roleLabel} big />
          </CollectiveContainer>
        ))}
      </Flex>
      <StyledButton onClick={handleBack}>Back</StyledButton>
    </Box>
  );
};

GroupView.propTypes = {
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
      type: PropTypes.string,
      imageUrl: PropTypes.string,
      activitySubscriptions: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          active: PropTypes.bool,
        }),
      ),
      host: PropTypes.shape({
        totalHostedCollectives: PropTypes.number,
      }),
    }),
  ),
  title: PropTypes.node,
  roleLabel: PropTypes.node,
  advancedSettings: PropTypes.bool,
};

export default GroupView;
