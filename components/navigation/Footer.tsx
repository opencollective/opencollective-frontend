import React from 'react';
import { Discord } from '@styled-icons/fa-brands/Discord';
import { Github } from '@styled-icons/fa-brands/Github';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Linkedin } from '@styled-icons/fa-brands/Linkedin';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { ChevronDown, ExternalLink, Mail } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { cn } from '../../lib/utils';

import Image from '../Image';
import { LanguageSwitcher } from '../LanguageSwitcher';
import Link from '../Link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';

import { dashboardFooterItems, regularFooterItems } from './menu-items';

const SocialLink = ({ href, children, title, ...props }) => (
  <Link
    href={href}
    title={title}
    aria-label={title}
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
    <div className={cn('flex max-w-36 flex-wrap items-center gap-1', className)}>
      <SocialLink href="https://linkedin.com/company/opencollective" rel="me" title="Open Collective LinkedIn link">
        <Linkedin size={16} />
      </SocialLink>
      <SocialLink href="https://x.com/@opencollect" rel="me" title="Open Collective Twitter link">
        <Twitter size={16} />
      </SocialLink>
      <SocialLink
        href="nostr:npub1hsr6x2zhw3y6zzndcfel0xwcckkhf05w2ghnulelsppcruq4c3qqzv5whg"
        rel="me"
        title="Open Collective Nostr link"
      >
        <svg viewBox="0 0 875 875" width="16" height="16">
          <path
            fill="currentColor"
            d="m684.72,485.57c.22,12.59-11.93,51.47-38.67,81.3-26.74,29.83-56.02,20.85-58.42,20.16s-3.09-4.46-7.89-3.77-9.6,6.17-18.86,7.2-17.49,1.71-26.06-1.37c-4.46.69-5.14.71-7.2,2.24s-17.83,10.79-21.6,11.47c0,7.2-1.37,44.57,0,55.89s3.77,25.71,7.54,36c3.77,10.29,2.74,10.63,7.54,9.94s13.37.34,15.77,4.11c2.4,3.77,1.37,6.51,5.49,8.23s60.69,17.14,99.43,19.2c26.74.69,42.86,2.74,52.12,19.54,1.37,7.89,7.54,13.03,11.31,14.06s8.23,2.06,12,5.83,1.03,8.23,5.49,11.66c4.46,3.43,14.74,8.57,25.37,13.71,10.63,5.14,15.09,13.37,15.77,16.11s1.71,10.97,1.71,10.97c0,0-8.91,0-10.97-2.06s-2.74-5.83-2.74-5.83c0,0-6.17,1.03-7.54,3.43s.69,2.74-7.89.69-11.66-3.77-18.17-8.57c-6.51-4.8-16.46-17.14-25.03-16.8,4.11,8.23,5.83,8.23,10.63,10.97s8.23,5.83,8.23,5.83l-7.2,4.46s-4.46,2.06-14.74-.69-11.66-4.46-12.69-10.63,0-9.26-2.74-14.4-4.11-15.77-22.29-21.26c-18.17-5.49-66.52-21.26-100.12-24.69s-22.63-2.74-28.11-1.37-15.77,4.46-26.4-1.37c-10.63-5.83-16.8-13.71-17.49-20.23s-1.71-10.97,0-19.2,3.43-19.89,1.71-26.74-14.06-55.89-19.89-64.12c-13.03,1.03-50.74-.69-50.74-.69,0,0-2.4-.69-17.49,5.83s-36.48,13.76-46.77,19.93-14.4,9.7-16.12,13.13c.12,3-1.23,7.72-2.79,9.06s-12.48,2.42-12.48,2.42c0,0-5.85,5.86-8.25,9.97-6.86,9.6-55.2,125.14-66.52,149.83-13.54,32.57-9.77,27.43-37.71,27.43s-8.06.3-8.06.3c0,0-12.34,5.88-16.8,5.88s-18.86-2.4-26.4,0-16.46,9.26-23.31,10.29-4.95-1.34-8.38-3.74c-4-.21-14.27-.12-14.27-.12,0,0,1.74-6.51,7.91-10.88,8.23-5.83,25.37-16.11,34.63-21.26s17.49-7.89,23.31-9.26,18.51-6.17,30.51-9.94,19.54-8.23,29.83-31.54c10.29-23.31,50.4-111.43,51.43-116.23.63-2.96,3.73-6.48,4.8-15.09.66-5.35-2.49-13.04,1.71-22.63,10.97-25.03,21.6-20.23,26.4-20.23s17.14.34,26.4-1.37,15.43-2.74,24.69-7.89,11.31-8.91,11.31-8.91l-19.89-3.43s-18.51.69-25.03-4.46-15.43-15.77-15.43-15.77l-7.54-7.2,1.03,8.57s-5.14-8.91-6.51-10.29-8.57-6.51-11.31-11.31-7.54-25.03-7.54-25.03l-6.17,13.03-1.71-18.86-5.14,7.2-2.74-16.11-4.8,8.23-3.43-14.4-5.83,4.46-2.4-10.29-5.83-3.43s-14.06-9.26-16.46-9.6-4.46,3.43-4.46,3.43l1.37,12-12.2-6.27-7-11.9s2.36,4.01-9.62,7.53c-20.55,0-21.89-2.28-24.93-3.94-1.31-6.56-5.57-10.11-5.57-10.11h-20.57l-.34-6.86-7.89,3.09.69-10.29h-14.06l1.03-11.31h-8.91s3.09-9.26,25.71-22.97,25.03-16.46,46.29-17.14c21.26-.69,32.91,2.74,46.29,8.23s38.74,13.71,43.89,17.49c11.31-9.94,28.46-19.89,34.29-19.89,1.03-2.4,6.19-12.33,17.96-17.6,35.31-15.81,108.13-34,131.53-35.54,31.2-2.06,7.89-1.37,39.09,2.06,31.2,3.43,54.17,7.54,69.6,12.69,12.58,4.19,25.03,9.6,34.29,2.06,4.33-1.81,11.81-1.34,17.83-5.14,30.69-25.09,34.72-32.35,43.63-41.95s20.14-24.91,22.54-45.14,4.46-58.29-10.63-88.12-28.8-45.26-34.63-69.26c-5.83-24-8.23-61.03-6.17-73.03,2.06-12,5.14-22.29,6.86-30.51s9.94-14.74,19.89-16.46c9.94-1.71,17.83,1.37,22.29,4.8,4.46,3.43,11.65,6.28,13.37,10.29.34,1.71-1.37,6.51,8.23,8.23,9.6,1.71,16.05,4.16,16.05,4.16,0,0,15.64,4.29,3.11,7.73-12.69,2.06-20.52-.71-24.29,1.69s-7.21,10.08-9.61,11.1-7.2.34-12,4.11-9.6,6.86-12.69,14.4-5.49,15.77-3.43,26.74,8.57,31.54,14.4,43.2c5.83,11.66,20.23,40.8,24.34,47.66s15.77,29.49,16.8,53.83,1.03,44.23,0,54.86-10.84,51.65-35.53,85.94c-8.16,14.14-23.21,31.9-24.67,35.03-1.45,3.13-3.02,4.88-1.61,7.65,4.62,9.05,12.87,22.13,14.71,29.22,2.29,6.64,6.99,16.13,7.22,28.72Z"
          />
        </svg>
      </SocialLink>
      <SocialLink
        href="https://mastodon.opencollective.com/@opencollective"
        rel="me"
        title="Open Collective Mastodon link"
      >
        <Mastodon size={16} />
      </SocialLink>
      <SocialLink href="https://github.com/opencollective" rel="me" title="Open Collective Github link">
        <Github size={16} />
      </SocialLink>
      <SocialLink href="https://discord.opencollective.com" title="Open Collective Discord link">
        <Discord size={16} />
      </SocialLink>
      <SocialLink href="/contact" title="Contact Open Collective">
        <Mail size={16} />
      </SocialLink>
    </div>
  );
};

const Footer = () => {
  const { LoggedInUser } = useLoggedInUser();

  if (LoggedInUser) {
    return (
      <footer className="flex justify-center border-t px-6 py-12 md:px-8">
        <div className="flex w-full max-w-(--breakpoint-xl) flex-1 flex-col items-start gap-6 sm:flex-row md:flex-col">
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
                <FormattedMessage id="footer.OC.description" defaultMessage="Sustain your community." />
              </span>
            </div>

            <LanguageSwitcher />
            <div className="hidden sm:block md:hidden">
              <SocialLinks />
            </div>
          </div>

          <div className="grid w-[160px] grid-cols-1 flex-row flex-wrap items-center gap-4 text-sm text-muted-foreground md:flex md:w-full md:justify-between">
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
            <div className="block sm:hidden md:block">
              <SocialLinks className="" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="flex-row border-t p-6 py-12">
      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) flex-1 flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
            <FormattedMessage id="footer.OC.description" defaultMessage="Sustain your community." />
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
                        <Link href={item.href}>{item.label}</Link>
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
