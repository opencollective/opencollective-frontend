import React from 'react';
import PropTypes from 'prop-types';
import { pick } from 'lodash';
import NextLink from 'next/link';
import { withRouter } from 'next/router';
import Scrollchor from 'react-scrollchor';

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
    router: PropTypes.object,
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
      const routeFromRouter = this.props.router.findByName(route);
      const path = routeFromRouter ? routeFromRouter.getAs(params) : `https://opencollective.com${route}`;
      return (
        <a href={path} title={title} target="_top" className={className} {...otherProps}>
          {children}
        </a>
      );
    } else {
      return (
        <NextLink href={route} {...pick(this.props, ['route', 'params', 'href', 'scroll', 'passHref'])}>
          <span className={className} title={title} onClick={onClick} data-cy={this.props['data-cy']}>
            {openInNewTab ? (
              <a
                className={className}
                title={title}
                onClick={onClick}
                data-cy={this.props['data-cy']}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ) : (
              children
            )}
          </span>
        </NextLink>
      );
    }
  }
}

export default withRouter(Link);
