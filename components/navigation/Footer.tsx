import React from 'react';
import { Github } from '@styled-icons/fa-brands/Github';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { Slack } from '@styled-icons/fa-brands/Slack';
import Twitter from '../icons/Twitter';
import { ChevronDown, ExternalLink, Mail } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { cn } from '../../lib/utils';

import Image from '../Image';
import { LanguageSwitcher } from '../LanguageSwitcher';
import Link from '../Link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

import { dashboardFooterItems, regularFooterItems } from './menu-items';

const SocialLink = ({ href, children, ...props }) => (
  <Link
    href={href}
    className={
      'flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground'
    }
    {...props}
  >
    {children}
  </Link>
);

const SocialLinks = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <SocialLink href="https://twitter.com/opencollect" rel="me" aria-label="Open Collective Twitter link">
        <Twitter size={16} />
      </SocialLink>
      <SocialLink
        href="https://mastodon.opencollective.com/@opencollective"
        rel="me"
        aria-label="Open Collective Mastodon link"
      >
        <Mastodon size={16} />
      </SocialLink>
      <SocialLink href="https://github.com/opencollective" rel="me" aria-label="Open Collective Github link">
        <Github size={16} />
      </SocialLink>
      <SocialLink href="https://slack.opencollective.com" aria-label="Open Collective Slack link">
        <Slack size={16} />
      </SocialLink>
      <SocialLink href="/contact" aria-label="Contact Open Collective">
        <Mail size={16} />
      </SocialLink>
    </div>
  );
};

const Footer = () => {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser && LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD)) {
    return (
      <footer className="flex justify-center border-t px-6 py-12 md:px-8">
        <div className="flex max-w-screen-xl flex-1 grid-cols-2 items-start gap-6 md:flex-col">
          <div className="flex w-full flex-1 flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
              <Link href="/home">
                <Image
                  src="/static/images/opencollectivelogo-footer-n.svg"
                  alt="Open Collective"
                  height={28}
                  width={167}
                />
              </Link>
              <span className="relative top-px hidden text-xs text-muted-foreground md:block">
                <FormattedMessage id="footer.OC.description" defaultMessage="Make your community sustainable." />
              </span>
            </div>

            <LanguageSwitcher />
            <div className="block md:hidden">
              <SocialLinks />
            </div>
          </div>

          <div className="grid w-[160px] grid-cols-1 flex-row flex-wrap items-center gap-4 text-sm text-muted-foreground sm:grid-cols-2 md:flex md:w-full md:justify-between">
            {dashboardFooterItems.map((item, i) => {
              if (item.items) {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="max-w-content group flex items-center hover:text-foreground">
                        {item.label}
                        <ChevronDown
                          className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                          aria-hidden="true"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {item.items.map(subItem => (
                          <Link key={subItem.href} href={subItem.href}>
                            <DropdownMenuItem className="cursor-pointer">{subItem.label}</DropdownMenuItem>
                          </Link>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }
              if (item.href) {
                return (
                  <div key={item.href}>
                    <Link className="block hover:text-foreground" href={item.href}>
                      {item.label}
                    </Link>
                  </div>
                );
              }
            })}
            <div className="hidden md:block">
              <SocialLinks className="" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="flex-row border-t p-6 py-12">
      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Image
                src="/static/images/opencollectivelogo-footer-n.svg"
                alt="Open Collective"
                height={28}
                width={167}
              />
            </Link>
            <LanguageSwitcher />
          </div>

          <span className="text-xs text-muted-foreground">
            <FormattedMessage id="footer.OC.description" defaultMessage="Make your community sustainable." />
          </span>
        </div>

        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-8 md:grid-cols-4 lg:grid-cols-5">
          <SocialLinks className="hidden lg:flex" />

          {regularFooterItems.map(({ label, items }, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className="text-sm antialiased" key={i}>
              <p className="mb-4 font-medium text-foreground">{label}</p>
              <ul className="space-y-2">
                {items.map(item =>
                  !LoggedInUser || (LoggedInUser && !(item.href === '/create-account' || item.href === '/signin')) ? (
                    <li className="text-muted-foreground hover:text-foreground" key={item.href}>
                      {item.href[0] === '/' ? (
                        <Link href={item.href} passHref legacyBehavior>
                          {item.label}
                        </Link>
                      ) : (
                        <a href={item.href}>
                          {item.label} <ExternalLink className="inline-block" size={12} />
                        </a>
                      )}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ))}
        </div>

        <SocialLinks className="flex lg:hidden" />
      </div>
    </footer>
  );
};

export default Footer;
