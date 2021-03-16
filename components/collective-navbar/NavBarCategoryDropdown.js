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
import { Span } from '../Text';

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

  span {
    font-size: 14px;
    line-height: 16px;
    text-decoration: none;
    white-space: nowrap;
    color: ${themeGet('colors.black.800')};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
  }

  &:focus,
  &:hover,
  &:focus span,
  &:hover span {
    text-decoration: none;
    font-weight: 700;
    outline: 0;
    letter-spacing: 0.0525em; /** To compensate the space taken by the font-weight difference */
    color: ${themeGet('colors.black.800')};
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
      @media (min-width: 64em) {
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
      @media (min-width: 64em) {
        display: none;
      }
    `}

  @media (max-width: 64em) {
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

    &:hover,
    &:focus {
      text-decoration: underline;
    }

    &:not(:hover) {
      color: #313233;
    }
  }
`;

const CategoryDropdown = styled(Dropdown)`
  @media (max-width: 64em) {
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
    return { as: Link, href: `/${collective.slug}${anchor}` };
  }
};

export const NavBarCategory = ({ category }) => {
  const intl = useIntl();
  return (
    <Flex>
      <Flex alignItems="center" mr={2}>
        <IconIllustration src={CATEGORY_ICON[category] || CATEGORY_ICON.CONTRIBUTE} />
      </Flex>
      <Flex alignItems="center">
        <Span textTransform="uppercase" fontSize="14px" fontWeight="500" color="black.800" letterSpacing="0.02em">
          {i18nNavbarCategory(intl, category)}
        </Span>
      </Flex>
    </Flex>
  );
};

NavBarCategory.propTypes = {
  category: PropTypes.oneOf(Object.values(NAVBAR_CATEGORIES)).isRequired,
};

const NavBarCategoryDropdown = ({ useAnchor, collective, category, isSelected, links }) => {
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
        <Flex pt="15px" pb="14px" px={[3, 1, 3, 1]}>
          <NavBarCategory category={category} />{' '}
        </Flex>
      </CategoryContainer>
      {displayedLinks.length > 0 && (
        <React.Fragment>
          <DropdownArrow />
          <DropdownContent>
            <Box as="ul" p={0} m={0} minWidth={184}>
              {displayedLinks.map(({ route, title }) => (
                <MenuItem key={route}>
                  <StyledLink as={Link} href={route}>
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
