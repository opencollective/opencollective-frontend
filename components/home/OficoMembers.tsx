import React from 'react';
import { ExternalLink } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  title: {
    defaultMessage: 'Community owned and stewarded by Open Finance Consortium',
    id: 'OficoMembers.title',
  },
  learnMore: {
    defaultMessage: 'Learn More about Open Finance Consortium',
    id: 'OficoMembers.learnMore',
  },
  openSourceCollective: {
    defaultMessage: 'Open Source Collective',
    id: 'OficoMembers.openSourceCollective',
  },
  openSourceCollectiveDesc: {
    defaultMessage:
      'A US 501(c)(6) nonprofit entity serving as fiscal host to open source projects and related communities around the world.',
    id: 'OficoMembers.openSourceCollectiveDesc',
  },
  openCollectiveEurope: {
    defaultMessage: 'Open Collective Europe',
    id: 'OficoMembers.openCollectiveEurope',
  },
  openCollectiveEuropeDesc: {
    defaultMessage:
      'A non-profit enabling simple, open, and lightweight financial management for charities and communities across Europe.',
    id: 'OficoMembers.openCollectiveEuropeDesc',
  },
  giftCollective: {
    defaultMessage: 'Gift Collective',
    id: 'OficoMembers.giftCollective',
  },
  giftCollectiveDesc: {
    defaultMessage: 'A NZ-based charitable entity hosting grassroots/community groups with a charitable focus.',
    id: 'OficoMembers.giftCollectiveDesc',
  },
  socialChangeNest: {
    defaultMessage: 'Social Change Nest',
    id: 'OficoMembers.socialChangeNest',
  },
  socialChangeNestDesc: {
    defaultMessage:
      'A UK host for mutual aid groups and social movements, providing tools, strategy, and back office support to scale up and get on with changing the world.',
    id: 'OficoMembers.socialChangeNestDesc',
  },
  raftFoundation: {
    defaultMessage: 'Raft Foundation',
    id: 'OficoMembers.raftFoundation',
  },
  raftFoundationDesc: {
    defaultMessage:
      'Raft Foundation is a US-based 501(c)(3) fiscal sponsor that brings communities together to support neighbors in need through',
    id: 'OficoMembers.raftFoundationDesc',
  },
});

const members = [
  {
    name: 'openSourceCollective',
    description: 'openSourceCollectiveDesc',
    country: 'US',
    image: '/static/images/ofico-members/osc-logo.png',
    gradient: 'from-blue-400 to-purple-500',
  },
  {
    name: 'openCollectiveEurope',
    description: 'openCollectiveEuropeDesc',
    country: 'EU',
    image: '/static/images/ofico-members/occ-logo.png',
    gradient: 'from-orange-200 to-blue-200',
  },
  {
    name: 'giftCollective',
    description: 'giftCollectiveDesc',
    country: 'NZ',
    image: '/static/images/ofico-members/gift-logo.png',
    gradient: 'from-purple-200 to-green-200',
  },
  {
    name: 'socialChangeNest',
    description: 'socialChangeNestDesc',
    country: 'UK',
    image: '/static/images/ofico-members/social-change-nest-logo.png',
    gradient: 'from-pink-200 to-red-200',
  },
  {
    name: 'raftFoundation',
    description: 'raftFoundationDesc',
    country: 'US',
    image: '/static/images/ofico-members/raft-logo.png',
    gradient: 'from-yellow-200 to-orange-200',
  },
];

const OficoMembers = () => {
  const { formatMessage } = useIntl();

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-800">{formatMessage(messages.title)}</h2>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <div
              key={member.name}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div className={`h-32 bg-gradient-to-br ${member.gradient} flex items-center justify-center p-4`}>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                    <div className="h-8 w-8 rounded bg-gray-300"></div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">{member.country}</span>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-gray-900">{formatMessage(messages[member.name])}</h3>

                <p className="text-sm leading-relaxed text-gray-600">{formatMessage(messages[member.description])}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200">
            {formatMessage(messages.learnMore)}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default OficoMembers;
