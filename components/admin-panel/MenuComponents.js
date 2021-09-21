import React from 'react';
import PropTypes from 'prop-types';
// import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown';
// import { ChevronRight } from '@styled-icons/fa-solid/ChevronRight';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { Box } from '../Grid';

import { SECTION_LABELS } from './constants';

const MenuLinkContainer = styled.li`
  margin: 4px -8px 0px;
  a {
    display: flex;
    justify-content: space-between;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    line-height: 22px;
    padding: 4px 12px;
    border-radius: 100px;
    cursor: pointer;
    color: ${props => props.theme.colors.black[700]};
    &:hover {
      color: ${props => props.theme.colors.primary[700]};
    }
    ${props =>
      props.isSelected &&
      css`
        background: ${props => props.theme.colors.primary[50]};
        color: ${props => props.theme.colors.primary[700]};
        font-weight: 700;
        font-size: 14px;
      `}
    ${props =>
      props.isStrong &&
      css`
        font-weight: 700;
        font-size: 15px;
        line-height: 22px;
      `}
  }
`;

export const MenuLink = ({ collective, section, children, onClick, isSelected, isStrong, if: conditional }) => {
  const router = useRouter();
  const { formatMessage } = useIntl();
  if (conditional === false) {
    return null;
  }

  const selectedSection = router.query?.section;
  const href = `${collective?.slug}/admin/${section}`;
  const handleClick = e => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };
  if (!children && SECTION_LABELS[section]) {
    children = formatMessage(SECTION_LABELS[section]);
  }

  return (
    <MenuLinkContainer isSelected={isSelected || (section && selectedSection === section)} isStrong={isStrong}>
      <a href={href} onClick={handleClick}>
        {children}
      </a>
    </MenuLinkContainer>
  );
};

MenuLink.propTypes = {
  if: PropTypes.bool,
  section: PropTypes.string,
  selectedSection: PropTypes.string,
  children: PropTypes.node,
  isSelected: PropTypes.bool,
  isStrong: PropTypes.bool,
  onClick: PropTypes.func,
  afterClick: PropTypes.func,
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

// const SubUl = styled.ul`
//   > li {
//     margin-left: 14px;
//   }
// `;

// export const MenuCollapseSubSection = ({ label, children }) => {
//   const [open, setOpen] = React.useState(false);
//   return (
//     <React.Fragment>
//       <MenuLink onClick={() => setOpen(!open)} isSelected={open} isStrong={true}>
//         <span>{label}</span>
//         <span>{open ? <ChevronDown size="10px" /> : <ChevronRight size="10px" />}</span>
//       </MenuLink>
//       {open && <SubUl>{children}</SubUl>}
//     </React.Fragment>
//   );
// };

// MenuCollapseSubSection.propTypes = {
//   label: PropTypes.node,
//   children: PropTypes.node,
// };

export const MenuSectionHeader = styled.div`
  font-weight: 700;
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  padding: 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.black[700]};
  color: ${props => props.theme.colors.black[800]};
`;

export const MenuContainer = styled.ul`
  margin: 0;
  margin-bottom: 100px;
  width: 256px;

  &,
  & ul {
    list-style-type: none;
    padding: 0;
  }

  ul {
    margin: 0;
  }
`;

export const MenuGroup = ({ if: conditional, children, ...props }) => {
  return conditional === false ? null : (
    <Box as="ul" {...props}>
      {children}
    </Box>
  );
};

MenuGroup.propTypes = {
  if: PropTypes.bool,
  children: PropTypes.node,
};

export const useSubmenu = () => {
  const [submenuContent, setSubmenu] = React.useState();
  const menuContent = submenuContent && (
    <React.Fragment>
      <ul>
        <MenuLink onClick={() => setSubmenu(undefined)}>
          <span>&larr; Back</span>
        </MenuLink>
      </ul>
      {submenuContent}
    </React.Fragment>
  );
  const SubMenu = ({ label, children, if: conditional }) => {
    return (
      <MenuLink
        if={conditional}
        onClick={() =>
          setSubmenu(
            <React.Fragment>
              <MenuSectionHeader>{label}</MenuSectionHeader>

              {children}
            </React.Fragment>,
          )
        }
      >
        <span>{label}</span>
        <span>&rarr;</span>
      </MenuLink>
    );
  };
  SubMenu.propTypes = {
    if: PropTypes.bool,
    label: PropTypes.node,
    children: PropTypes.node,
  };
  return { menuContent, SubMenu };
};
