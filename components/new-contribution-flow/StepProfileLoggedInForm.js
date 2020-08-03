import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { remove } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Avatar from '../../components/Avatar';
import { Box, Flex } from '../../components/Grid';
import StyledRadioList from '../../components/StyledRadioList';
import { P } from '../../components/Text';

const messages = defineMessages({
  incognito: { id: 'profile.incognito', defaultMessage: 'Incognito' },
});

const NewContributionFlowStepProfileLoggedInForm = ({
  profiles,
  defaultSelectedProfile,
  onChange,
  canUseIncognito,
}) => {
  const intl = useIntl();

  // set initial default profile so it shows in Steps Progress as well
  useEffect(() => {
    onChange({ stepProfile: defaultSelectedProfile });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelectedProfile]);

  // if the user doesn't have an incognito profile yet, we offer to create one
  if (canUseIncognito) {
    const incognitoProfile = profiles.find(p => p.type === 'USER' && p.isIncognito);
    if (!incognitoProfile) {
      profiles.push({
        id: 'incognito',
        type: 'USER',
        isIncognito: true,
        name: intl.formatMessage(messages['incognito']),
      });
    }
  } else {
    remove(profiles, p => p.isIncognito);
  }

  return (
    <Fragment>
      <Box px={3}>
        <StyledRadioList
          name="ContributionProfile"
          id="ContributionProfile"
          options={profiles}
          keyGetter="id"
          defaultValue={defaultSelectedProfile ? defaultSelectedProfile.id : undefined}
          onChange={selected => {
            onChange({ stepProfile: selected.value });
          }}
        >
          {({ radio, value }) => (
            <Box minHeight={70} py={2} bg="white.full" px={3}>
              <Flex alignItems="center" justifyContent="space-between">
                <Flex alignItems="center" maxWidth={400}>
                  <Box as="span" mr={3} flexWrap="wrap">
                    {radio}
                  </Box>
                  <Flex mr={2} css={{ flexBasis: '26px' }}>
                    {value.type === 'USER' && <Avatar collective={value} size="3.6rem" />}
                    {value.type !== 'USER' && value.slug && <Avatar collective={value} radius="3.6rem" />}
                  </Flex>
                  <Flex flexDirection="column" maxWidth={200}>
                    <P fontSize="14px" fontWeight={600} color="black.900" mb={1}>
                      {value.name}
                    </P>
                    {value.type === 'USER' && (
                      <P fontSize="12px" fontWeight={400} color="black.500">
                        <FormattedMessage id="ContributionFlow.PersonalProfile" defaultMessage="Personal profile" /> -{' '}
                        {value.email}
                      </P>
                    )}
                    {value.type === 'COLLECTIVE' && (
                      <P fontSize="12px" fontWeight={400} color="black.500">
                        <FormattedMessage id="ContributionFlow.CollectiveProfile" defaultMessage="Collective profile" />
                      </P>
                    )}
                    {value.type === 'ORGANIZATION' && (
                      <P fontSize="12px" fontWeight={400} color="black.500">
                        <FormattedMessage
                          id="ContributionFlow.OrganizationProfile"
                          defaultMessage="Organization profile"
                        />
                      </P>
                    )}
                  </Flex>
                </Flex>
                <InfoCircle size={16} />
              </Flex>
            </Box>
          )}
        </StyledRadioList>
      </Box>
    </Fragment>
  );
};

NewContributionFlowStepProfileLoggedInForm.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func,
  defaultSelectedProfile: PropTypes.object,
  profiles: PropTypes.array,
  canUseIncognito: PropTypes.bool,
};

export default NewContributionFlowStepProfileLoggedInForm;
