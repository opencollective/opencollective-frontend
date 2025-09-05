import React from 'react';
import { ExternalLink } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';

import Avatar from '../Avatar';
import Link from '../Link';
import { Button } from '../ui/Button';

const messages = defineMessages({
  title: {
    defaultMessage: 'Stewarded by <OficoLink></OficoLink>',
    id: 'OficoMembers.title',
  },
  description: {
    defaultMessage:
      'OFiCo is a nonprofit 501(c)(6) coordinating the governance and evolution of open financial tools. Together, we maintain and govern the platform ensuring it stays community-owned, and designed for the long-term resilience of the commons.',
    id: 'OficoMembers.description',
  },
  learnMore: {
    defaultMessage: 'Learn More about Open Finance Consortium',
    id: 'OficoMembers.learnMore',
  },
  'fiscalHosting.hosts.OSC': {
    id: 'fiscalHosting.hosts.OSC',
    defaultMessage:
      'A US 501(c)(6) nonprofit entity serving as fiscal host to open source projects and related communities around the world.',
  },
  'fiscalHosting.hosts.OCE': {
    id: 'fiscalHosting.hosts.OCE',
    defaultMessage:
      'A Brussels-based nonprofit hosting groups across Europe, including open source projects and community social action.',
  },
  'fiscalHosting.hosts.giftcollective': {
    id: 'fiscalHosting.hosts.giftcollective',
    defaultMessage: 'A NZ-based charitable entity hosting grassroots/community groups with a charitable focus.',
  },
  'fiscalHosting.hosts.socialchangenestcollective': {
    id: 'fiscalHosting.hosts.socialchangenestcollective',
    defaultMessage:
      'A UK host for mutual aid groups and social movements, providing tools, strategy, and back office support to scale up and get on with changing the world.',
  },
  'fiscalHosting.hosts.raft': {
    id: 'fiscalHosting.hosts.raft',
    defaultMessage:
      'Raft Foundation is a US-based 501(c)(3) fiscal sponsor that brings communities together to support neighbors in need.',
  },
});

const MEMBERS = [
  {
    id: 'OSC',
    name: 'Open Source Collective',
    location: '🇺🇸 United States',
    collectivePath: '/opensource',
    bgImage: 'osc',
    logo: '/static/images/become-a-host/osc-logo.png',
  },
  {
    id: 'OCE',
    name: 'Open Collective Europe',
    location: ' 🇪🇺 Europe',
    collectivePath: '/europe',
    bgImage: 'oce-bg',
    logo: '/static/images/fiscal-hosting/oce.png',
  },
  {
    id: 'giftcollective',
    name: 'Gift Collective',
    location: '🇳🇿 New Zealand',
    collectivePath: '/giftcollective',
    bgImage: 'giftcollective-bg',
    logo: '/static/images/fiscal-hosting/giftcollective.png',
  },
  {
    id: 'socialchangenestcollective',
    name: 'Social Change Nest',
    location: '🇬🇧 United Kingdom',
    collectivePath: '/the-social-change-nest',
    bgImage: 'socialchangenest',
    logo: '/static/images/become-a-host/socialchangenest-logo.png',
  },
  {
    id: 'raft',
    name: 'Raft Foundation',
    location: '🇺🇸 United States',
    collectivePath: '/raft',
    bgImage: 'raft-bg',
    logo: '/static/images/fiscal-hosting/raft.png',
  },
];

// Map HOSTS data to the component's expected format
const members = MEMBERS.map(host => ({
  id: host.id,
  name: host.name,
  location: host.location,
  logo: host.logo,
  bgImage: host.bgImage,
  collectivePath: host.collectivePath,
  description: `fiscalHosting.hosts.${host.id}`,
}));

const OficoMembers = () => {
  const { formatMessage } = useIntl();

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-[2rem] font-bold text-slate-800">
          {formatMessage(messages.title, {
            OficoLink: () => (
              <Link href="https://openfinanceconsortium.org" className="underline">
                Open Finance Consortium
              </Link>
            ),
          })}
        </h2>
        <p className="mx-auto mb-12 max-w-3xl text-center text-lg text-balance text-slate-800">
          {formatMessage(messages.description)}
        </p>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {members.map(member => (
            <Link
              href={member.collectivePath}
              key={member.id}
              className="w-full max-w-md overflow-hidden rounded-lg bg-background p-6 transition-colors duration-200 hover:bg-muted md:w-96"
            >
              <div
                className="flex h-52 w-full items-center justify-center rounded-lg bg-cover bg-center bg-no-repeat p-4"
                style={{
                  backgroundImage: `url("/static/images/become-a-host/${member.bgImage}.png")`,
                  backgroundSize: 'cover',
                }}
              >
                <Avatar radius="96px" src={member.logo} name={member.name} type="ORGANIZATION" className="bg-white" />
              </div>

              <div className="mt-3">
                <div className="mb-3">
                  <span className="text-sm font-medium text-muted-foreground">{member.location}</span>
                </div>

                <h3 className="mb-3 text-xl leading-tight font-bold">{member.name}</h3>

                <p className="leading-relaxed text-muted-foreground">{formatMessage(messages[member.description])}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" className="gap-2 rounded-full text-base" size="xl">
            <a href="https://oficonsortium.org/" target="_blank">
              {formatMessage(messages.learnMore)}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OficoMembers;
