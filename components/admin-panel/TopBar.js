/* eslint-disable styled-components-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';
import { Menu2 as MenuIcon } from '@styled-icons/remix-line/Menu2';
import FocusTrap from 'focus-trap-react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import styled, { createGlobalStyle } from 'styled-components';

import { getCollectiveTypeKey } from '../../lib/collective-sections';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import Avatar from '../Avatar';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { fadeIn } from '../StyledKeyframes';

import { PAGE_TITLES, SECTION_LABELS } from './constants';
import SideBar from './SideBar';

const MenuWrapper = styled(Flex)`
  position: fixed;
  top: 0px;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: ${props => props.zindex || 3000};
`;

const MenuBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2500;
  display: block;
  animation: ${fadeIn} 0.25s;
  will-change: opacity;
`;

const SideBarWrapper = styled(Flex)`
  z-index: 2600;
  background: #fff;
`;

const GlobalModalStyle = createGlobalStyle`
  body {
    overflow: hidden;
  }
`;

const Container = styled(Flex)`
  height: 64px;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 999;

  background-color: #fff;
  color: ${props => props.theme.colors.black[600]};

  box-shadow: 0px 1px 4px 1px rgba(49, 50, 51, 0.1);
`;

const Title = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${props => props.theme.colors.black[700]};

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Separator = styled(Box)`
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: ${props => props.theme.colors.black[800]};
`;

const Section = styled.div`
  font-weight: 700;
  font-size: 18px;
  line-height: 26px;
  color: ${props => props.theme.colors.black[900]};

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MenuLink = styled.div`
  cursor: pointer;
  color: ${props => props.theme.colors.black[700]};
  &:hover {
    color: ${props => props.theme.colors.primary[700]};
  }
`;

const AdminPanelTopBar = ({ collective, selectedSection, isLoading, ...props }) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleRouteChange = () => {
      setMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, []);

  return (
    <Container alignItems="center" {...props}>
      <Box mr="14px">
        <MenuLink tabIndex="0" role="button" onClick={() => setMenuOpen(true)}>
          <MenuIcon size="24px" />
        </MenuLink>
      </Box>
      <Box mr="20px">
        {isLoading ? (
          <LoadingPlaceholder height={40} width={40} />
        ) : (
          <Link href={getCollectivePageRoute(collective)}>
            <Avatar collective={collective} radius={40} />
          </Link>
        )}
      </Box>
      <Flex alignItems="center" overflow="hidden">
        {isLoading ? (
          <LoadingPlaceholder height={16} width={120} />
        ) : (
          <Title>{formatMessage(PAGE_TITLES[getCollectiveTypeKey(collective.type)])}</Title>
        )}
        {SECTION_LABELS[selectedSection] && (
          <React.Fragment>
            <Separator mx="8px">/</Separator>
            {isLoading ? (
              <LoadingPlaceholder height={16} width={80} />
            ) : (
              <Section>{formatMessage(SECTION_LABELS[selectedSection])}</Section>
            )}
          </React.Fragment>
        )}
      </Flex>
      {isMenuOpen &&
        document &&
        createPortal(
          <React.Fragment>
            <GlobalModalStyle />
            <MenuWrapper zindex={1000}>
              <SideBarWrapper p="16px 24px">
                <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
                  <SideBar collective={collective} selectedSection={selectedSection} />
                </FocusTrap>
              </SideBarWrapper>
              <MenuBackdrop
                role="button"
                tabIndex={0}
                onClick={() => setMenuOpen(false)}
                onKeyDown={event => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setMenuOpen(false);
                  }
                }}
              />
            </MenuWrapper>
          </React.Fragment>,
          document.body,
        )}
    </Container>
  );
};

AdminPanelTopBar.propTypes = {
  isLoading: PropTypes.bool,
  selectedSection: PropTypes.string,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default AdminPanelTopBar;
