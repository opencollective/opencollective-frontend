import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { FormattedMessage, useIntl } from 'react-intl';

import { ActivityClasses } from '../../../../lib/constants/activities';
import { ActivityClassesI18N } from '../../../../lib/i18n/activities-classes';

import Avatar from '../../../Avatar';
import { Box, Flex } from '../../../Grid';
import StyledButton from '../../../StyledButton';
import StyledHr from '../../../StyledHr';
import StyledTag from '../../../StyledTag';
import { P, Span } from '../../../Text';

import ActivitySwitch from './ActivitySwitch';

const CollectiveSettings = ({ account, advancedSettings, big, roleLabel, ...boxProps }) => {
  const intl = useIntl();
  const [displayAdvancedSettings, setDisplayAdvancedSettings] = React.useState(false);

  return (
    <Box {...boxProps}>
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          {big ? (
            <React.Fragment>
              <Avatar collective={account} radius={48} mr={3} />
              <P fontSize="16px" lineHeight="24px" fontWeight="500">
                {account.name}
                <br />
                <Span fontSize="14px" lineHeight="20px" color="black.600">
                  {roleLabel}
                </Span>
              </P>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <StyledTag
                variant="rounded"
                fontSize="11px"
                lineHeight="16px"
                backgroundColor="black.50"
                border="1px solid #C3C6CB"
                mr={2}
                p="4px 8px"
              >
                <Avatar collective={account} radius={16} mr="6px" />
                {account.name}
              </StyledTag>
              {account.host && (
                <Box>
                  ({account.host.totalHostedCollectives}{' '}
                  <FormattedMessage
                    defaultMessage="{count, plural, one {collective} other {collectives}}"
                    id="PEfD6k"
                    values={{ count: account.host.totalHostedCollectives }}
                  />
                  )
                </Box>
              )}
            </React.Fragment>
          )}
        </Flex>
        <Flex>
          {advancedSettings && (
            <StyledButton
              buttonStyle="secondary"
              buttonSize="tiny"
              isBorderless
              mr={2}
              display={['none', 'block']}
              onClick={() => setDisplayAdvancedSettings(!displayAdvancedSettings)}
            >
              {displayAdvancedSettings ? (
                <FormattedMessage id="AdvancedSettings.Hide" defaultMessage="Hide advanced settings" />
              ) : (
                <FormattedMessage id="AdvancedSettings.Show" defaultMessage="Show advanced settings" />
              )}
              {displayAdvancedSettings ? <ChevronUp size="1em" /> : <ChevronDown size="1em" />}
            </StyledButton>
          )}
          <ActivitySwitch account={account} activityType="ACTIVITY_ALL" />
        </Flex>
      </Flex>
      {advancedSettings && (
        <StyledButton
          buttonStyle="secondary"
          buttonSize="tiny"
          isBorderless
          mt={2}
          display={['block', 'none']}
          onClick={() => setDisplayAdvancedSettings(!displayAdvancedSettings)}
        >
          {displayAdvancedSettings ? (
            <FormattedMessage id="AdvancedSettings.Hide" defaultMessage="Hide advanced settings" />
          ) : (
            <FormattedMessage id="AdvancedSettings.Show" defaultMessage="Show advanced settings" />
          )}
          {displayAdvancedSettings ? <ChevronUp size="1em" /> : <ChevronDown size="1em" />}
        </StyledButton>
      )}
      {big && displayAdvancedSettings && <StyledHr width="100%" my={3} />}
      {advancedSettings &&
        displayAdvancedSettings &&
        Object.keys(ActivityClasses).map(activity => (
          <Box key={activity}>
            <Flex mt={3} alignItems="center" justifyContent="space-between">
              <P fontSize="14px" fontWeight="500" lineHeight="20px">
                {intl.formatMessage(ActivityClassesI18N[`${ActivityClasses[activity]}.title`])}
              </P>
              <ActivitySwitch account={account} activityType={activity} />
            </Flex>
            <P mt="2" fontSize="12px" color="black.700" lineHeight="18px" letterSpacing="0px">
              {intl.formatMessage(ActivityClassesI18N[`${ActivityClasses[activity]}.description`])}
            </P>
          </Box>
        ))}
      {advancedSettings && !big && <StyledHr width="100%" mt={displayAdvancedSettings ? 4 : 3} borderStyle="dashed" />}
    </Box>
  );
};

CollectiveSettings.propTypes = {
  account: PropTypes.shape({
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
  advancedSettings: PropTypes.bool,
  big: PropTypes.bool,
  roleLabel: PropTypes.node,
};

export default CollectiveSettings;
