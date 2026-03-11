import React, { Fragment } from 'react';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import useGlobalBlur from '../lib/hooks/useGlobalBlur';
import { getEnvVar } from '@/lib/env-utils';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { parseToBoolean } from '@/lib/utils';

import { legacyTopBarItems, newMarketingTopbarItems } from './navigation/menu-items';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/Collapsible';
import Container from './Container';
import { Box, Flex } from './Grid';
import { HideGlobalScroll } from './HideGlobalScroll';
import Link from './Link';
const ListItem = styled.li`
  list-style: none;
  font-family: Inter;
  font-style: normal;
  font-weight: 500;
  font-size: 15px;
  line-height: 18px;
  padding-top: 10px;
  cursor: pointer;
  a:not(:hover) {
    color: #313233;
  }
`;

const SubListItem = styled(ListItem)`
  padding-bottom: 10px;
`;

const TopBarMobileMenu = ({ closeMenu }) => {
  const innerRef = React.useRef(undefined);
  const { LoggedInUser } = useLoggedInUser();
  useGlobalBlur(innerRef, isOutside => {
    if (isOutside) {
      closeMenu();
    }
  });

  const menuItems = parseToBoolean(getEnvVar('NEW_PRICING')) ? newMarketingTopbarItems : legacyTopBarItems;

  return (
    <React.Fragment>
      <HideGlobalScroll />
      <Container
        ref={innerRef}
        bg="white.full"
        width="100%"
        position="absolute"
        right={[0, 0, 16]}
        top={[69, 69, 75]}
        p={3}
        zIndex={3000}
        borderRadius="0px 0px 16px 16px"
        boxShadow="0px 8px 12px rgba(20, 20, 20, 0.16)"
        data-cy="user-menu"
      >
        <Box as="ul" my={2} pl={0} pb={2}>
          {LoggedInUser && (
            <ListItem>
              <Link href={'/dashboard'} onClick={closeMenu}>
                <FormattedMessage defaultMessage="Dashboard" id="Dashboard" />
              </Link>
            </ListItem>
          )}
          {menuItems.map((menuItem, index) => (
            <Fragment key={menuItem.label.id}>
              <ListItem>
                {menuItem.items ? (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Flex justifyContent="space-between" style={{ cursor: 'pointer' }}>
                        <FormattedMessage {...menuItem.label} />
                        <ChevronDown size={20} />
                      </Flex>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Box as="ul" my={2} pl="12px">
                        {menuItem.items.map(subItem => (
                          <SubListItem key={subItem.href}>
                            {subItem.target === '_blank' ? (
                              <a href={subItem.href} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                                <FormattedMessage {...subItem.label} />
                              </a>
                            ) : (
                              <Link href={subItem.href} onClick={closeMenu}>
                                <FormattedMessage {...subItem.label} />
                              </Link>
                            )}
                          </SubListItem>
                        ))}
                      </Box>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link href={menuItem.href} onClick={closeMenu}>
                    <FormattedMessage {...menuItem.label} />
                  </Link>
                )}
              </ListItem>
              {index < menuItems.length - 1 && <hr className="my-5" />}
            </Fragment>
          ))}
        </Box>
      </Container>
    </React.Fragment>
  );
};

export default TopBarMobileMenu;
