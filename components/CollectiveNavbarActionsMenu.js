import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import themeGet from '@styled-system/theme-get';
import { get, truncate, uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';

import { applyToHostMutation } from './ApplyToHostBtnLoggedIn';
import Container from './Container';
import { Box, Flex } from './Grid';
import Link from './Link';
import Loading from './Loading';
import StyledTooltip from './StyledTooltip';
import { P } from './Text';
import { withUser } from './UserProvider';

//  Styled components
const BlueChevronDown = styled(ChevronDown)`
  color: ${themeGet('colors.blue.600')};
  width: 24px;
  height: 24px;
`;
const BlueReceipt = styled(Receipt)`
  color: ${themeGet('colors.blue.600')};
  width: 20px;
  height: 20px;
`;
const BlueDollar = styled(Dollar)`
  color: ${themeGet('colors.blue.600')};
  width: 20px;
  height: 20px;
`;
const BlueEnvelope = styled(Envelope)`
  color: ${themeGet('colors.blue.600')};
  width: 20px;
  height: 20px;
`;
const BlueCheckCircle = styled(CheckCircle)`
  color: ${themeGet('colors.blue.600')};
  width: 20px;
  height: 20px;
`;

const ListItem = styled(Flex).attrs({
  alignItems: 'center',
  py: '1',
})`
  cursor: pointer;
`;
const MenuContainer = styled(Container).attrs({
  minWidth: '50px',
  maxWidth: '250px',
  width: '100%',
  position: 'absolute',
  right: 30,
  top: 50,
  zIndex: 3000,
  bg: 'white.full',
})`
  display: flex;
  flex-direction: column;
  border-radius: 5px;
`;

const MenuOutline = styled(Container)`
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
  border: 1px solid rgba(18, 19, 20, 0.12);
  box-shadow: 0 4px 8px 0 rgba(61, 82, 102, 0.08);
  border-radius: 10px;

  ::after,
  ::before {
    bottom: 100%;
    right: 15px;
    border: solid transparent;
    content: ' ';
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
  }

  ::after {
    border-color: rgba(255, 255, 255, 0);
    border-bottom-color: #ffffff;
    border-width: 5px;
    right: 16px;
    background-clip: padding-box;
  }

  ::before {
    border-color: rgba(184, 184, 184, 0);
    border-bottom-color: #b8b8b8;
    border-width: 6px;
    background-clip: padding-box;
  }
`;

const getCollectivesNeedingAHost = user => {
  const memberships = uniqBy(
    user?.memberOf.filter(m => m.role === 'ADMIN'),
    m => m.collective.id,
  );
  const collectives = memberships
    .filter(m => m.collective.type === 'COLLECTIVE')
    .sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  const collectivesNeedingAHost = collectives
    .filter(c => c.collective.host === null)
    .sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  return collectivesNeedingAHost;
};

const CollectiveNavbarActionsMenu = ({
  collective,
  callsToAction: { hasSubmitExpense, hasContact, hasApply },
  LoggedInUser,
  loadingLoggedInUser,
  createNotification,
}) => {
  const hasRequestGrant =
    [CollectiveType.FUND].includes(collective.type) || collective.settings?.fundingRequest === true;
  const hasActions = hasSubmitExpense || hasContact || hasApply || hasRequestGrant;
  const [showActionsMenu, toggleShowActionsMenu] = React.useState(false);
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;
  const [applyToHostWithCollective, { error }] = useMutation(applyToHostMutation);

  if (loadingLoggedInUser) {
    return <Loading />;
  }
  const collectivesToApplyToHostWith = getCollectivesNeedingAHost(LoggedInUser);

  // Do not render the menu if there are no available CTAs
  if (!hasActions) {
    return null;
  }

  return (
    <Container display="flex">
      <Flex alignItems="center" onClick={() => toggleShowActionsMenu(!showActionsMenu)}>
        <P my={2} fontSize="16px" textTransform="uppercase" color="blue.700">
          <FormattedMessage id="CollectivePage.NavBar.ActionMenu.Actions" defaultMessage="Actions" />
        </P>
        <BlueChevronDown size="1.5em" cursor="pointer" />
        {showActionsMenu && (
          <MenuContainer>
            <MenuOutline>
              <Flex flexDirection={['column', 'row']} maxHeight={['calc(100vh - 68px)', '100%']}>
                <Box order={[2, 1]} flex="10 1 50%" width={[1, 1, 1 / 2]} px={3} py={1} bg="white.full">
                  <Box as="ul" p={0} my={2}>
                    {hasSubmitExpense && (
                      <ListItem>
                        <Flex mx={2}>
                          <BlueReceipt />
                        </Flex>
                        <P
                          as={Link}
                          route="create-expense"
                          params={{ collectiveSlug: collective.slug }}
                          my={2}
                          fontSize="13px"
                          color="black.800"
                        >
                          <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                        </P>
                      </ListItem>
                    )}
                    {hasRequestGrant && (
                      <ListItem py={1}>
                        <Flex mx={2}>
                          <BlueDollar />
                        </Flex>
                        <P my={2} fontSize="13px" color="black.800">
                          <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
                        </P>
                      </ListItem>
                    )}
                    {hasContact && (
                      <ListItem py={1}>
                        <Flex mx={2}>
                          <BlueEnvelope />
                        </Flex>
                        <P
                          as={Link}
                          route="collective-contact"
                          params={{ collectiveSlug: collective.slug }}
                          my={2}
                          fontSize="13px"
                          color="black.800"
                        >
                          <FormattedMessage id="Contact" defaultMessage="Contact" />
                        </P>
                      </ListItem>
                    )}
                    {hasApply && (
                      <React.Fragment>
                        {hostWithinLimit ? (
                          collectivesToApplyToHostWith.map(c => {
                            return (
                              <ListItem
                                key={c.collective.name}
                                py={1}
                                onClick={async () => {
                                  await applyToHostWithCollective({
                                    variables: {
                                      collective: {
                                        id: c.collective.id,
                                        HostCollectiveId: collective.id,
                                      },
                                    },
                                  });
                                  if (error) {
                                    createNotification('error', c.collective.name);
                                  } else {
                                    createNotification('default', c.collective.name);
                                  }
                                }}
                              >
                                <Flex mx={2}>
                                  <BlueCheckCircle />
                                </Flex>
                                <P my={2} fontSize="13px" color="black.800">
                                  <FormattedMessage
                                    id="host.apply.btn"
                                    defaultMessage="Apply with {collective}"
                                    values={{
                                      collective: <strong>{truncate(c.collective.name, { length: 15 })}</strong>,
                                    }}
                                  />
                                </P>
                              </ListItem>
                            );
                          })
                        ) : (
                          <StyledTooltip
                            place="left"
                            content={
                              <FormattedMessage
                                id="host.hostLimit.warning"
                                defaultMessage="Host already reached the limit of hosted collectives for its plan. <a>Contact {collectiveName}</a> and let them know you want to apply."
                                values={{
                                  collectiveName: collective.name,
                                  // eslint-disable-next-line react/display-name
                                  a: chunks => <Link route={`/${collective.slug}/contact`}>{chunks}</Link>,
                                }}
                              />
                            }
                          >
                            <ListItem py={1}>
                              <Flex mx={2}>
                                <BlueCheckCircle />
                              </Flex>
                              <P my={2} fontSize="13px" color="black.800">
                                <FormattedMessage id="Actions.ApplyToHost" defaultMessage="Apply to this host" />
                              </P>
                            </ListItem>
                          </StyledTooltip>
                        )}
                      </React.Fragment>
                    )}
                  </Box>
                </Box>
              </Flex>
            </MenuOutline>
          </MenuContainer>
        )}
      </Flex>
    </Container>
  );
};

CollectiveNavbarActionsMenu.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string,
    settings: PropTypes.object,
  }),
  callsToAction: PropTypes.shape({
    /** Button to contact the collective */
    hasContact: PropTypes.bool,
    /** Submit new expense button */
    hasSubmitExpense: PropTypes.bool,
    /** Hosts "Apply" button */
    hasApply: PropTypes.bool,
  }).isRequired,
  LoggedInUser: PropTypes.object,
  loadingLoggedInUser: PropTypes.bool,
  createNotification: PropTypes.func,
};

CollectiveNavbarActionsMenu.defaultProps = {
  callsToAction: {},
  buttonsMinWidth: 100,
};

export default withUser(CollectiveNavbarActionsMenu);
