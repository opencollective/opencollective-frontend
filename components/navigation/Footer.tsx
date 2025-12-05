import React from 'react';
import { Discord } from '@styled-icons/fa-brands/Discord';
import { Github } from '@styled-icons/fa-brands/Github';
import { Linkedin } from '@styled-icons/fa-brands/Linkedin';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { ExternalLink, Mail } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { cn, parseToBoolean } from '../../lib/utils';
import { getEnvVar } from '@/lib/env-utils';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useWhitelabelProvider from '@/lib/hooks/useWhitelabel';

import Image from '../Image';
import { LanguageSwitcher } from '../LanguageSwitcher';
import Link from '../Link';

import { legacyFooterItems, newFooterItems } from './menu-items';

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

const Footer = ({ className, isDashboard }: { className?: string; isDashboard?: boolean }) => {
  const intl = useIntl();
  const whitelabel = useWhitelabelProvider();
  const { LoggedInUser } = useLoggedInUser();
  const usingNewPricing = parseToBoolean(getEnvVar('NEW_PRICING'));

  const footerItems = usingNewPricing ? newFooterItems : legacyFooterItems;

  return (
    <footer className={cn('border-t bg-background pt-16 antialiased', className)}>
      <div className="mx-auto max-w-(--breakpoint-xl) px-3 md:px-6">
        <div className="xl:flex xl:gap-12">
          <div className="max-w-xs space-y-6">
            <div className="space-y-4">
              {whitelabel ? (
                <React.Fragment>
                  <Link href={`/${whitelabel.slug}`}>
                    <img className="max-h-7" src={whitelabel.logo.url} alt={whitelabel.name} />
                  </Link>
                  <span className="relative top-px hidden text-sm text-muted-foreground md:block">
                    <FormattedMessage id="footer.Whitelabel.description" defaultMessage="Powered by Open Collective." />
                  </span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Link href="/home" className="block">
                    <Image
                      src="/static/images/opencollectivelogo-footer-n.svg"
                      alt="Open Collective"
                      height={28}
                      width={167}
                    />
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage
                      id="footer.OC.description.new"
                      defaultMessage="Collaborative, transparent, financial management tool"
                    />
                  </p>
                </React.Fragment>
              )}
            </div>

            <LanguageSwitcher />
          </div>

          <div className="mt-16 grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 xl:col-span-2 xl:mt-0">
            {!whitelabel && (
              <React.Fragment>
                {footerItems.map(({ label, items }) => (
                  <div className="text-sm antialiased" key={label.id}>
                    <p className="mb-4 text-sm/6 font-medium text-slate-900">{intl.formatMessage(label)}</p>
                    <ul className="space-y-4">
                      {items.map(item =>
                        !LoggedInUser || (LoggedInUser && !(item.href === '/signup' || item.href === '/signin')) ? (
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

      {!isDashboard && (
        <div className="mt-16 bg-muted">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row lg:px-8">
            <p className="text-sm text-muted-foreground">&nbsp;</p>
            <SocialLinks className="gap-2" iconSize={18} />
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
