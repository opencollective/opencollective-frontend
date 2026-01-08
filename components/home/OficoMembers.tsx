import React from 'react';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
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
    bgImage: '/static/images/ofico/osc-bg.png',
    logo: '/static/images/ofico/osc-logo.png',
  },
  {
    id: 'OCE',
    name: 'Open Collective Europe',
    location: ' 🇪🇺 Europe',
    collectivePath: '/europe',
    bgImage: '/static/images/ofico/oce-bg.jpg',
    logo: '/static/images/ofico/oce-logo.png',
  },
  {
    id: 'giftcollective',
    name: 'Gift Collective',
    location: '🇳🇿 New Zealand',
    collectivePath: '/giftcollective',
    bgImage: '/static/images/ofico/giftcollective-bg.png',
    logo: '/static/images/ofico/giftcollective-logo.png',
  },
  {
    id: 'socialchangenestcollective',
    name: 'Social Change Nest',
    location: '🇬🇧 United Kingdom',
    collectivePath: '/the-social-change-nest',
    bgImage: '/static/images/ofico/scn-bg.png',
    logo: '/static/images/ofico/scn-logo.png',
  },
  {
    id: 'raft',
    name: 'Raft Foundation',
    location: '🇺🇸 United States',
    collectivePath: '/raft',
    bgImage: '/static/images/ofico/raft-bg.png',
    logo: '/static/images/ofico/raft-logo.png',
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
              <Link key="ofico-link" href="https://openfinanceconsortium.org" className="underline">
                <Avatar
                  radius={42}
                  src={'/static/images/ofico/ofico-logo.png'}
                  name="Open Finance Consortium"
                  type="ORGANIZATION"
                  className="mr-1 !inline-flex bg-white align-text-top"
                />
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
              <div className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-lg p-4">
                <Image
                  src={member.bgImage}
                  alt={`${member.name} background`}
                  fill
                  className="object-cover"
                  sizes="448px"
                />
                <div className="relative z-10">
                  <Avatar radius="96px" src={member.logo} name={member.name} type="ORGANIZATION" className="bg-white" />
                </div>
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
