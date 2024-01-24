import React, { forwardRef, useEffect, useState } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link'; // eslint-disable-line no-restricted-imports
interface LinkProps extends NextLinkProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  openInNewTab?: boolean;
  'data-cy'?: string;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const [isIframe, setIsIframe] = useState(false);
  const isHash = typeof props.href === 'string' && props.href.startsWith('#');

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  const { children, openInNewTab, ...rest } = props;

  return (
    <NextLink
      {...rest}
      {...(openInNewTab || isIframe ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      scroll={!isHash} // `scroll=false` enables smooth scrolling to hash links
      ref={ref}
    >
      {children}
    </NextLink>
  );
});

Link.displayName = 'Link';

export default Link;
