import React from 'react';
import PropTypes from 'prop-types';
import router from '../server/pages';
import { pick } from 'lodash';

import styled, { css } from 'styled-components';
import { border, color, layout, space, typography } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import { whiteSpace, textDecoration } from '../lib/styled_system_custom';
import { buttonSize, buttonStyle } from '../lib/theme';

const StyledInternalLink = styled.a`
  color: ${themeGet('colors.primary.500')};

  &:hover {
    color: ${themeGet('colors.primary.300')};
  }

  ${border}
  ${color}
  ${layout}
  ${space}
  ${typography}
  ${textDecoration}
  ${whiteSpace}

  ${buttonStyle}
  ${buttonSize}

  &[disabled] {
    pointer-events: none;
    cursor: default;
    text-decoration: none;
    color: ${themeGet('colors.black.300')};
  }

  ${props =>
    props.buttonStyle &&
    css`
      cursor: pointer;
      outline: 0;
      border: 1px solid;
      border-radius: 100px;

      &:disabled {
        cursor: not-allowed;
      }

      &:focus {
        box-shadow: 0px 0px 0px 2px #83ebb4;
      }
    `}
`;

class InternalLink extends React.Component {
  static propTypes = {
    route: PropTypes.string,
    params: PropTypes.object,
    target: PropTypes.string,
    animate: PropTypes.object,
    className: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,

    buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
    buttonStyle: PropTypes.oneOf(['primary', 'standard']),
    color: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    display: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    fontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    href: PropTypes.string,
    space: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    textAlign: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    textDecoration: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.isIframe = window.self !== window.top && window.location.hostname !== 'localhost'; // cypress is using an iframe for e2e testing
  }

  render() {
    const { route, params, children, className, title, onClick, ...otherProps } = this.props;

    if (this.isIframe) {
      const routeFromRouter = router.findByName(route);
      const path = routeFromRouter ? routeFromRouter.getAs(params) : `https://opencollective.com${route}`;
      return (
        <StyledInternalLink href={path} title={title} target="_top" className={className} {...otherProps}>
          {children}
        </StyledInternalLink>
      );
    } else {
      return (
        <router.NextLink {...pick(this.props, ['route', 'params', 'href', 'scroll', 'passHref'])}>
          <StyledInternalLink className={className} title={title} onClick={onClick} href={route}>
            {children}
          </StyledInternalLink>
        </router.NextLink>
      );
    }
  }
}

export default InternalLink;
