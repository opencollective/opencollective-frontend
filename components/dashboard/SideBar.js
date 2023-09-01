import React from 'react';
import PropTypes from 'prop-types';
import { MenuIcon } from 'lucide-react';

import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { cn } from '../../lib/utils';

import { Box } from '../Grid';
import { HideGlobalScroll } from '../HideGlobalScroll';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { DrawerMenu } from '../navigation/DrawerMenu';
import StyledRoundButton from '../StyledRoundButton';

import AccountSwitcher from './AccountSwitcher';
import Menu from './Menu';

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
      <div>
        {isLoading ? (
          [...Array(5).keys()].map(i => (
            <Box key={i}>
              <LoadingPlaceholder height={24} mb={12} borderRadius={8} maxWidth={'70%'} />
            </Box>
          ))
        ) : (
          <Menu {...{ collective, selectedSection, onRoute, isAccountantOnly }} />
        )}
      </div>
    ),
    [collective, isLoading, viewport],
  );

  return (
    <div
      className={cn(' w-full flex-shrink-0 flex-grow-0 md:w-64', isMobile && 'sticky top-0 z-[1000] bg-white py-2.5')}
      {...props}
    >
      <div className="sticky top-8 z-10">
        <div className="flex flex-row-reverse gap-4 sm:flex-auto md:flex-col">
          <AccountSwitcher activeSlug={activeSlug} isLoading={isLoading} />
          {isMobile && (
            <React.Fragment>
              <StyledRoundButton size={50} onClick={() => setMenuOpen(true)} data-cy="mobile-menu-trigger">
                <MenuIcon size={24} />
              </StyledRoundButton>

              <React.Fragment>
                <DrawerMenu anchor="left" open={isMenuOpen} onClose={() => setMenuOpen(false)} p="16px">
                  {content}
                </DrawerMenu>
                <HideGlobalScroll />
              </React.Fragment>
            </React.Fragment>
          )}
          {!isMobile && <React.Fragment>{content}</React.Fragment>}
        </div>
      </div>
    </div>
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
