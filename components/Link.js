import React from 'react';
import PropTypes from 'prop-types';
import { pick } from 'lodash';
import NextLink from 'next/link';
import Scrollchor from 'react-scrollchor';

import router from '../server/pages';

class Link extends React.Component {
  static propTypes = {
    route: PropTypes.string,
    params: PropTypes.object,
    target: PropTypes.string,
    animate: PropTypes.object,
    className: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    openInNewTab: PropTypes.bool,
    children: PropTypes.node.isRequired,
    'data-cy': PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.isHash = props.route && props.route.substr(0, 1) === '#';
  }

  componentDidMount() {
    this.isIframe = window.self !== window.top && window.location.hostname !== 'localhost'; // cypress is using an iframe for e2e testing
  }

  render() {
    const { route, params, children, className, title, onClick, openInNewTab, ...otherProps } = this.props;
    if (this.isHash) {
      const afterAnimate = () => {
        if (window.history) {
          history.pushState({ ...history.state, as: location.pathname + route }, undefined, route);
        }
      };
      return (
        <Scrollchor
          animate={this.props.animate}
          to={route.substr(1)}
          className={className}
          disableHistory={true}
          afterAnimate={afterAnimate}
        >
          {children}
        </Scrollchor>
      );
    } else if (this.isIframe) {
      const routeFromRouter = router.findByName(route);
      const path = routeFromRouter ? routeFromRouter.getAs(params) : `https://opencollective.com${route}`;
      return (
        <a href={path} title={title} target="_top" className={className} {...otherProps}>
          {children}
        </a>
      );
    } else {
      return (
        <NextLink {...pick(this.props, ['route', 'params', 'href', 'scroll', 'passHref'])}>
          <a
            className={className}
            title={title}
            onClick={onClick}
            data-cy={this.props['data-cy']}
            {...(!openInNewTab ? null : { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {children}
          </a>
        </NextLink>
      );
    }
  }
}

export default Link;
