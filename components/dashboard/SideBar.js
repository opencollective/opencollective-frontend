import React from 'react';
import PropTypes from 'prop-types';
import { Globe2, Menu as MenuIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { Box, Flex } from '../Grid';
import { HideGlobalScroll } from '../HideGlobalScroll';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { DrawerMenu } from '../navigation/DrawerMenu';
import StyledButton from '../StyledButton';
import StyledRoundButton from '../StyledRoundButton';

import AccountSwitcher from './AccountSwitcher';
import Menu from './Menu';

const Sticky = styled.div`
  position: sticky;
  top: 32px;
  z-index: 10;
`;

const MenuWrapper = styled(Box)`
  ${props =>
    props.isMobile
      ? css`
          position: sticky;
          top: 0px;
          z-index: 1000;
          background: #fffe;
          padding: 10px 0px;
        `
      : ''}
`;

const MenuContainer = styled(Flex)`
  a {
    color: ${props => props.theme.colors.black[900]};
    &:hover {
      color: ${props => props.theme.colors.black[700]};
    }
  }
`;

const AdminPanelSideBar = ({
  collective,
  activeSlug,
  isAccountantOnly,
  isLoading,
  selectedSection,
  onRoute: _onRoute,
  ...props
}) => {
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const { viewport } = useWindowResize();
  const isMobile = [VIEWPORTS.XSMALL, VIEWPORTS.SMALL].includes(viewport);

  const onRoute = isMobile
    ? (...args) => {
        setMenuOpen(false);
        _onRoute?.(...args);
      }
    : _onRoute;

  const content = React.useMemo(
    () => (
      <Box mt={[0, null, '32px']}>
        {isLoading ? (
          [...Array(5).keys()].map(i => (
            <Box key={i}>
              <LoadingPlaceholder height={24} mb={12} borderRadius={8} maxWidth={'70%'} />
            </Box>
          ))
        ) : (
          <Menu {...{ collective, selectedSection, onRoute, isAccountantOnly }} />
        )}
      </Box>
    ),
    [collective, isLoading],
  );

  return (
    <MenuWrapper {...props} flexGrow={0} flexShrink={0} width={['100%', '100%', '288px']} isMobile={isMobile}>
      <Sticky>
        <MenuContainer flexDirection={['row-reverse', null, 'column']} m="0" gap="16px">
          <AccountSwitcher activeSlug={activeSlug} isLoading={isLoading} />
          {isMobile && (
            <React.Fragment>
              <StyledRoundButton size={50} onClick={() => setMenuOpen(true)} data-cy="mobile-menu-trigger">
                <MenuIcon size={24} />
              </StyledRoundButton>

              {isMenuOpen && (
                <React.Fragment>
                  <DrawerMenu top="73px" anchor="left" onClose={() => setMenuOpen(false)} open={true} p="16px">
                    {content}
                  </DrawerMenu>
                  <HideGlobalScroll />
                </React.Fragment>
              )}
            </React.Fragment>
          )}
          {!isMobile && (
            <React.Fragment>
              <StyledButton
                as={Link}
                buttonSize="tiny"
                href={getCollectivePageRoute(collective)}
                height="24px"
                textAlign="center"
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Globe2 size={12} />
                &nbsp;
                <FormattedMessage id="PublicProfile" defaultMessage="Public profile" />
              </StyledButton>
              {content}
            </React.Fragment>
          )}
        </MenuContainer>
      </Sticky>
    </MenuWrapper>
  );
};

AdminPanelSideBar.propTypes = {
  isLoading: PropTypes.bool,
  selectedSection: PropTypes.string,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isHost: PropTypes.bool,
  }),
  isAccountantOnly: PropTypes.bool,
  onRoute: PropTypes.func,
  activeSlug: PropTypes.string,
};

export default AdminPanelSideBar;
