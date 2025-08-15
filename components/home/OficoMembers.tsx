import React from 'react';
import { ExternalLink } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';

import Avatar from '../Avatar';
import Link from '../Link';
import { Button } from '../ui/Button';

const messages = defineMessages({
  title: {
    defaultMessage: 'Community owned and stewarded by Open Finance Consortium',
    id: 'OficoMembers.title',
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
      'Raft Foundation is a US-based 501(c)(3) fiscal sponsor that brings communities together to support neighbors in need through',
  },
});

export const MEMBERS = [
  {
    id: 'OSC',
    name: 'Open Source Collective',
    location: '🇺🇸 United States',
    collectivePath: '/opensource/apply',
    bgImage: 'osc',
    logo: '/static/images/become-a-host/osc-logo.png',
  },
  {
    id: 'OCE',
    name: 'Open Collective Europe',
    location: ' 🇪🇺 Europe',
    collectivePath: '/europe/apply',
    bgImage: 'oce-bg',
    logo: '/static/images/fiscal-hosting/oce.png',
  },
  {
    id: 'giftcollective',
    name: 'Gift Collective',
    location: '🇳🇿 New Zealand',
    collectivePath: '/giftcollective/apply',
    bgImage: 'giftcollective-bg',
    logo: '/static/images/fiscal-hosting/giftcollective.png',
  },
  {
    id: 'socialchangenestcollective',
    name: 'Social Change Nest',
    location: '🇬🇧 United Kingdom',
    collectivePath: '/the-social-change-nest/apply',
    bgImage: 'socialchangenest',
    logo: '/static/images/become-a-host/socialchangenest-logo.png',
  },
  {
    id: 'raft',
    name: 'Raft Foundation',
    location: '🇺🇸 United States',
    collectivePath: '/raft/apply',
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
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-800">{formatMessage(messages.title)}</h2>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <Link
              href={member.collectivePath}
              key={member.id}
              className="overflow-hidden rounded-lg bg-background p-6 transition-colors duration-200 hover:bg-muted"
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
          <Button asChild variant="outline" className="gap-2 rounded-full">
            <a
              href="https://oficonsortium.org/"
              target="_blank"
              // className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-6 py-3 font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200"
            >
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
