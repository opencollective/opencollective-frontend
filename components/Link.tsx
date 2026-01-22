import React, { useMemo } from 'react';
import { BookText } from 'lucide-react';
import NextLink, { type LinkProps as NextLinkProps } from 'next/link'; // eslint-disable-line no-restricted-imports
import { Scrollchor } from 'react-scrollchor';

import { cn } from '@/lib/utils';

const constructRoutePath = (href: string | NextLinkProps['href']) => {
  if (typeof href === 'string') {
    return href;
  } else if (href) {
    return href.pathname;
  } else {
    return '';
  }
};

type LinkProps = {
  children: React.ReactNode;
  tabIndex?: number;
  href?: string | NextLinkProps['href'];
  target?: string;
  animate?: unknown;
  className?: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  openInNewTab?: boolean;
  'data-cy'?: string;
  innerRef?: React.Ref<HTMLAnchorElement>;
  as?: string | NextLinkProps['as'];
  $isActive?: boolean;
} & NextLinkProps;

const Link = ({ href, children, className, openInNewTab, innerRef, onClick, title, ...props }: LinkProps) => {
  const isHash = href && constructRoutePath(href).startsWith('#');
  const isIframe = useMemo(() => typeof window !== 'undefined' && window.self !== window.top, []);

  if (isHash) {
    const route = constructRoutePath(href);
    const afterAnimate = () => {
      if (window.history) {
        history.pushState({ ...history.state, as: location.pathname + route }, undefined, route);
      }
    };
    return (
      <Scrollchor
        animate={props.animate}
        to={route.substring(1)}
        className={className}
        disableHistory={true}
        afterAnimate={afterAnimate}
        title={title}
      >
        {children}
      </Scrollchor>
    );
  } else {
    return (
      <NextLink
        href={href}
        title={title}
        onClick={onClick}
        className={className}
        data-cy={props['data-cy']}
        {...props}
        {...(openInNewTab || isIframe ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
        ref={innerRef}
      >
        {children}
      </NextLink>
    );
  }
};

export default React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => <Link innerRef={ref} {...props} />);

export const DocumentationLink = ({ href, children, className }: Omit<LinkProps, 'href'> & { href: string }) => {
  return (
    <Link
      href={href}
      openInNewTab
      className={cn(
        'inline-flex flex-wrap items-baseline gap-1 text-wrap text-primary underline hover:text-primary/80 [&>svg]:size-[0.8rem]',
        className,
      )}
    >
      <BookText /> {children}
    </Link>
  );
};
