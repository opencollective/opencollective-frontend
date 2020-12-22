import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import i18nNavbarCategory from '../../lib/i18n/navbar-categories';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import { Dropdown, DropdownArrow, DropdownContent } from '../StyledDropdown';
import StyledLink from '../StyledLink';

import aboutNavbarIcon from '../../public/static/images/collective-navigation/CollectiveNavbarIconAbout.png';
import budgetNavbarIcon from '../../public/static/images/collective-navigation/CollectiveNavbarIconBudget.png';
import connectNavbarIcon from '../../public/static/images/collective-navigation/CollectiveNavbarIconConnect.png';
import contributeNavbarIcon from '../../public/static/images/collective-navigation/CollectiveNavbarIconContribute.png';
import eventsNavbarIcon from '../../public/static/images/collective-navigation/CollectiveNavbarIconEvents.png';

const CATEGORY_ICON = {
  ABOUT: aboutNavbarIcon,
  BUDGET: budgetNavbarIcon,
  CONNECT: connectNavbarIcon,
  CONTRIBUTE: contributeNavbarIcon,
  CONTRIBUTIONS: contributeNavbarIcon,
  EVENTS: eventsNavbarIcon,
};

const IconIllustration = styled.img.attrs({ alt: '' })`
  width: 32px;
  height: 32px;
`;

const CategoryContainer = styled(StyledLink).attrs({ px: [1, 3, 0] })`
  display: block;
  width: 100%;
  font-size: 14px;
  line-height: 16px;
  text-decoration: none;
  white-space: nowrap;
  color: ${themeGet('colors.black.700')};

  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-weight: 500;

  &:focus {
    color: ${themeGet('colors.primary.700')};
    text-decoration: none;
  }

  &:hover {
    color: ${themeGet('colors.primary.400')};
    text-decoration: none;
  }

  &::after {
    content: '';
    display: block;
    width: 0%;
    height: 3px;
    background: ${themeGet('colors.primary.500')};
    transition: width 0.3s;
    float: center;
    opacity: 0;
  }

  ${props =>
    props.isSelected &&
    css`
      color: #090a0a;
      font-weight: 500;

      @media (min-width: 52em) {
        &::after {
          width: 100%;
          margin: 0 auto;
          opacity: 1;
        }
      }
    `}

  ${props =>
    props.mobileOnly &&
    css`
      @media (min-width: 52em) {
        display: none;
      }
    `}

  @media (max-width: 52em) {
    border-top: 1px solid #e1e1e1;
    &::after {
      display: none;
    }
  }
`;

const MenuItem = styled('li')`
  display: flex;
  align-items: center;

  & > a {
    padding: 12px;

    @media (max-width: 40em) {
      padding-top: 4px;
    }
  }

  &,
  & > a {
    width: 100%;
    text-align: left;
    font-style: normal;
    font-size: 13px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: -0.4px;
    outline: none;

    &:not(:hover) {
      color: #313233;
    }
  }
`;

const CategoryDropdown = styled(Dropdown)`
  @media (max-width: 52em) {
    ${DropdownArrow} {
      display: none !important;
    }
    ${DropdownContent} {
      display: block;
      position: relative;
      box-shadow: none;
      border: none;
      padding-left: 48px;
    }
  }
`;

const getLinkProps = (useAnchor, collective, category) => {
  const anchor = `#category-${category}`;
  if (useAnchor) {
    return { href: anchor };
  } else {
    return { as: Link, route: `/${collective.slug}${anchor}` };
  }
};

const NavBarCategoryDropdown = ({ useAnchor, collective, category, isSelected, links }) => {
  const intl = useIntl();
  const displayedLinks = links.filter(link => !link.hide);
  return (
    <CategoryDropdown trigger="hover" tabIndex="-1">
      <CategoryContainer
        mr={[0, null, 3]}
        isSelected={isSelected}
        {...getLinkProps(useAnchor, collective, category)}
        onClick={e => {
          // Remove focus to make sure dropdown gets closed
          if (document.activeElement?.contains(e.target)) {
            document.activeElement.blur();
          }
        }}
      >
        <Flex pt="15px" pb="14px" px={[3, 0]}>
          <Flex alignItems="center" mr={2}>
            <IconIllustration src={CATEGORY_ICON[category] || CATEGORY_ICON.CONTRIBUTE} />
          </Flex>
          <Flex alignItems="center">
            {i18nNavbarCategory(intl, category, {
              hasProjects: collective.type === 'FUND',
              hasEvents: collective.type !== 'FUND',
            })}
          </Flex>
        </Flex>
      </CategoryContainer>
      {displayedLinks.length > 0 && (
        <React.Fragment>
          <DropdownArrow />
          <DropdownContent>
            <Box as="ul" p={0} m={0} minWidth={184}>
              {displayedLinks.map(({ route, title, params }) => (
                <MenuItem key={route}>
                  <StyledLink as={Link} route={route} params={params}>
                    {title}
                  </StyledLink>
                </MenuItem>
              ))}
            </Box>
          </DropdownContent>
        </React.Fragment>
      )}
    </CategoryDropdown>
  );
};

NavBarCategoryDropdown.propTypes = {
  category: PropTypes.oneOf(Object.values(NAVBAR_CATEGORIES)).isRequired,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool,
  useAnchor: PropTypes.bool,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      route: PropTypes.string,
      title: PropTypes.node,
      hide: PropTypes.bool,
    }),
  ),
};

export default NavBarCategoryDropdown;
