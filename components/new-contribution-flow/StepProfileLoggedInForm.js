import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  collective,
}) => {
  const intl = useIntl();

  // set initial default profile so it shows in Steps Progress as well
  useEffect(() => {
    onChange({ stepProfile: defaultSelectedProfile });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelectedProfile]);

  const filteredProfiles = React.useMemo(() => {
    const filtered = [...profiles];

    // if admin of collective you are donating to, remove it from the list
    remove(filtered, p => p.id === collective.legacyId);

    // if the user doesn't have an incognito profile yet, we offer to create one
    if (canUseIncognito) {
      const incognitoProfile = filtered.find(p => p.type === 'USER' && p.isIncognito);
      if (!incognitoProfile) {
        filtered.push({
          id: 'incognito',
          type: 'USER',
          isIncognito: true,
          name: intl.formatMessage(messages['incognito']),
        });
      }
    } else {
      remove(filtered, p => p.isIncognito);
    }

    return filtered;
  }, [profiles]);

  return (
    <Fragment>
      <Box px={3}>
        <StyledRadioList
          name="ContributionProfile"
          id="ContributionProfile"
          options={filteredProfiles}
          keyGetter="id"
          defaultValue={defaultSelectedProfile ? defaultSelectedProfile.id : undefined}
          radioSize={16}
          onChange={selected => {
            onChange({ stepProfile: selected.value });
          }}
        >
          {({ radio, value }) => (
            <Box minHeight={70} py={2} bg="white.full" px={[0, 3]}>
              <Flex alignItems="center" width={1}>
                <Box as="span" mr={3} flexWrap="wrap">
                  {radio}
                </Box>
                <Flex mr={3} css={{ flexBasis: '26px' }}>
                  <Avatar collective={value} size="3.6rem" />
                </Flex>
                <Flex flexDirection="column" flexGrow={1} maxWidth="75%">
                  <P fontSize="14px" lineHeight="21px" fontWeight={500} color="black.900" truncateOverflow>
                    {value.name}
                  </P>
                  {value.type === 'USER' &&
                    (value.isIncognito ? (
                      <P fontSize="12px" lineHeight="18px" fontWeight="normal" color="black.500">
                        <FormattedMessage
                          id="profile.incognito.description"
                          defaultMessage="Keep my contribution private (see FAQ for more info)"
                        />
                      </P>
                    ) : (
                      <P fontSize="12px" lineHeight="18px" fontWeight="normal" color="black.500">
                        <FormattedMessage id="ContributionFlow.PersonalProfile" defaultMessage="Personal profile" /> -{' '}
                        {value.email}
                      </P>
                    ))}
                  {value.type === 'COLLECTIVE' && (
                    <P fontSize="12px" lineHeight="18px" fontWeight="normal" color="black.500">
                      <FormattedMessage id="ContributionFlow.CollectiveProfile" defaultMessage="Collective profile" />
                    </P>
                  )}
                  {value.type === 'ORGANIZATION' && (
                    <P fontSize="12px" lineHeight="18px" fontWeight="normal" color="black.500">
                      <FormattedMessage
                        id="ContributionFlow.OrganizationProfile"
                        defaultMessage="Organization profile"
                      />
                    </P>
                  )}
                </Flex>
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
  collective: PropTypes.object,
};

export default NewContributionFlowStepProfileLoggedInForm;
