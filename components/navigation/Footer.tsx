import React from 'react';
import { Discord } from '@styled-icons/fa-brands/Discord';
import { Github } from '@styled-icons/fa-brands/Github';
import { Linkedin } from '@styled-icons/fa-brands/Linkedin';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { ChevronDown, ExternalLink, Mail } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '../../lib/utils';
import useWhitelabelProvider from '@/lib/hooks/useWhitelabel';

import Image from '../Image';
import { LanguageSwitcher } from '../LanguageSwitcher';
import Link from '../Link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

import { footerItems, marketingTopbarItems } from './menu-items';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import SignupLogin from '../SignupLogin';
import { Separator } from '../ui/Separator';

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

const SocialLinks = ({ className, iconSize = 16 }: { className?: string; iconSize?: number }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <SocialLink href="https://linkedin.com/company/opencollective" rel="me" title="Open Collective LinkedIn link">
        <Linkedin size={iconSize} />
      </SocialLink>
      <SocialLink href="https://x.com/@opencollect" rel="me" title="Open Collective Twitter link">
        <Twitter size={iconSize} />
      </SocialLink>
      <SocialLink
        href="https://mastodon.opencollective.com/@opencollective"
        rel="me"
        aria-label="Open Collective Mastodon link"
      >
        <Mastodon size={iconSize} />
      </SocialLink>
      <SocialLink href="https://github.com/opencollective" rel="me" aria-label="Open Collective Github link">
        <Github size={iconSize} />
      </SocialLink>
      <SocialLink href="https://discord.opencollective.com" aria-label="Open Collective Discord link">
        <Discord size={iconSize} />
      </SocialLink>
      <SocialLink href="/contact" aria-label="Contact Open Collective">
        <Mail size={iconSize} />
      </SocialLink>
    </div>
  );
};

const Footer = ({ className }: { className?: string }) => {
  const intl = useIntl();
  const whitelabel = useWhitelabelProvider();
  const { LoggedInUser } = useLoggedInUser();
  return (
    <React.Fragment>
      <footer className="bg-background antialiased">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <Separator className="mb-16" />
          <div className="xl:flex xl:gap-12">
            <div className="max-w-xs space-y-6">
              <div className="space-y-4">
                <Link href="/home" className="block">
                  <Image
                    width={555}
                    height={75}
                    className="!h-7 w-auto"
                    src="/static/images/ofi-opencollective-logo.png"
                    alt="Open Collective"
                  />
                </Link>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage
                    id="footer.OC.description.new"
                    defaultMessage="Collaborative, transparent, financial management tool"
                  />
                </p>
              </div>

              <LanguageSwitcher />
            </div>

            <div className="mt-16 grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 xl:col-span-2 xl:mt-0">
              {footerItems.map(({ label, items }) => (
                <div className="text-sm antialiased" key={label.id}>
                  <p className="mb-4 text-sm/6 font-medium text-slate-900">{intl.formatMessage(label)}</p>
                  <ul className="space-y-4">
                    {items.map(item =>
                      !LoggedInUser ||
                      (LoggedInUser && !(item.href === '/create-account' || item.href === '/signin')) ? (
                        <li className="text-slate-600 hover:text-foreground" key={item.label.id}>
                          {item.href[0] === '/' ? (
                            <Link href={item.href}>{intl.formatMessage(item.label)}</Link>
                          ) : (
                            <a href={item.href}>
                              {intl.formatMessage(item.label)} <ExternalLink className="inline-block" size={12} />
                            </a>
                          )}
                        </li>
                      ) : null,
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-muted">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row lg:px-8">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Open Finance Technologies Inc. All rights reserved.
            </p>
            <SocialLinks className="gap-2" iconSize={18} />
          </div>
        </div>
      </footer>
    </React.Fragment>
  );
  return (
    <footer className={cn('space-y-8 border-t pt-12', className)}>
      <div className="mx-auto flex max-w-(--breakpoint-xl) justify-center px-6 md:px-8">
        <div className="flex flex-1 flex-col items-start gap-8 sm:flex-row md:flex-col">
          <div className="flex w-full flex-1 flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex flex-col items-start gap-2">
              {whitelabel ? (
                <React.Fragment>
                  <Link href={`/${whitelabel.slug}`}>
                    <img className="max-h-7" src={whitelabel.logo.url} alt={whitelabel.name} />
                  </Link>
                  <span className="relative top-px hidden text-xs text-muted-foreground md:block">
                    <FormattedMessage id="footer.Whitelabel.description" defaultMessage="Powered by Open Collective." />
                  </span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Link href="/home">
                    <Image
                      width={555}
                      height={75}
                      className="!h-8 w-auto"
                      src="/static/images/ofi-opencollective-logo.png"
                      alt="Open Collective"
                    />
                  </Link>
                  <span className="relative top-px hidden text-xs text-muted-foreground md:block">
                    <FormattedMessage
                      id="footer.OC.description.new"
                      defaultMessage="Collaborative, transparent, financial management tool"
                    />
                  </span>
                </React.Fragment>
              )}
            </div>

            <LanguageSwitcher />
          </div>

          <div className="grid w-[160px] grid-cols-1 flex-row flex-wrap items-center gap-4 text-sm md:flex md:w-full md:justify-between">
            {!whitelabel && (
              <React.Fragment>
                {footerItems.map(item => {
                  if (item.items) {
                    return (
                      <div key={item.label.id}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="max-w-content group flex items-center hover:text-foreground">
                            {intl.formatMessage(item.label)}
                            <ChevronDown
                              className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                              aria-hidden="true"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {item.items.map(subItem => (
                              <Link key={subItem.href || subItem.label.id} href={subItem.href}>
                                <DropdownMenuItem className="cursor-pointer">
                                  {intl.formatMessage(subItem.label)}
                                </DropdownMenuItem>
                              </Link>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  }
                  if (item.href) {
                    return (
                      <div key={item.href || item.label.id}>
                        <Link className="block hover:text-foreground" href={item.href}>
                          {intl.formatMessage(item.label)}
                        </Link>
                      </div>
                    );
                  }
                })}
              </React.Fragment>
            )}
            {whitelabel?.links?.map(({ label, href }) => (
              <div key={href}>
                <a className="block hover:text-foreground" href={href}>
                  {label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-muted">
        <div className="mx-auto flex max-w-(--breakpoint-xl) flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row lg:px-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Open Finance Technologies Inc. All rights reserved.
          </p>
          <SocialLinks className="gap-2" iconSize={18} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
