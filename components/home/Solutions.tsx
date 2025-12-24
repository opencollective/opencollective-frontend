import React from 'react';
import { ArrowRight } from 'lucide-react';
import NextImage from 'next/image';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Button } from '@/components/ui/Button';

import Link from '../Link';

const messages = defineMessages({
  'home.solutions.title': {
    id: 'home.solutions.title',
    defaultMessage: 'Tell us who you are',
  },
  'home.solutions.legallyIncorporated.title': {
    id: 'home.solutions.legallyIncorporated.title',
    defaultMessage: 'Legally Incorporated',
  },
  'home.solutions.legallyIncorporated.description': {
    id: 'home.solutions.legallyIncorporated.description',
    defaultMessage: 'For Foundations, Non-Profits, Companies, Public Sector and Co-ops',
  },
  'home.solutions.legallyIncorporated.feature1': {
    id: 'home.solutions.legallyIncorporated.feature1',
    defaultMessage: 'Legally registered',
  },
  'home.solutions.legallyIncorporated.feature2': {
    id: 'home.solutions.legallyIncorporated.feature2',
    defaultMessage: 'Have access to professional accounting',
  },
  'home.solutions.legallyIncorporated.feature3': {
    id: 'home.solutions.legallyIncorporated.feature3',
    defaultMessage: 'Have access to legal advisors',
  },
  'home.solutions.legallyIncorporated.button': {
    id: 'home.solutions.legallyIncorporated.button',
    defaultMessage: 'Explore Organization Features',
  },
  'home.solutions.unincorporated.title': {
    id: 'home.solutions.unincorporated.title',
    defaultMessage: 'Unincorporated',
  },
  'home.solutions.unincorporated.description': {
    id: 'home.solutions.unincorporated.description',
    defaultMessage: 'For Collectives, Groups and Projects without a legal identity',
  },
  'home.solutions.unincorporated.feature1': {
    id: 'home.solutions.unincorporated.feature1',
    defaultMessage: 'Not legally registered',
  },
  'home.solutions.unincorporated.feature2': {
    id: 'home.solutions.unincorporated.feature2',
    defaultMessage: 'Need access to a legal status',
  },
  'home.solutions.unincorporated.feature3': {
    id: 'home.solutions.unincorporated.feature3',
    defaultMessage: 'Need a trusted home for your money',
  },
  'home.solutions.unincorporated.button': {
    id: 'home.solutions.unincorporated.button',
    defaultMessage: 'Join As A Collective',
  },
});

const Solutions = () => {
  return (
    <div className="relative mt-10 flex min-h-[600px] items-center justify-center px-4 py-24">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <NextImage
          width={1853}
          height={820}
          src="/static/images/blue-watercolor-bg.png"
          alt=""
          priority
          className="h-full w-auto object-cover opacity-80"
        />
      </div>

      <div className="relative z-10 flex max-w-6xl flex-col items-center">
        <h2 className="mb-10 text-center text-[2rem] font-bold text-oc">
          <FormattedMessage {...messages['home.solutions.title']} />
        </h2>

        <div className="flex w-full max-w-[64rem] flex-col items-center gap-3 md:flex-row">
          <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="relative mb-6">
              <div className="absolute right-0 -bottom-1 left-0 w-full">
                <NextImage
                  src="/static/images/subtitle-green.png"
                  alt=""
                  width={720}
                  height={64}
                  className="h-6 w-full object-fill opacity-80"
                  aria-hidden
                />
              </div>
              <h3 className="relative mb-2 text-[2.5rem] font-bold text-oc">
                <FormattedMessage {...messages['home.solutions.legallyIncorporated.title']} />
              </h3>
            </div>

            <p className="mb-4 text-xl font-semibold">
              <FormattedMessage {...messages['home.solutions.legallyIncorporated.description']} />
            </p>

            <div className="mb-8 flex-grow space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                <p className="text-slate-700">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.feature1']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                <p className="text-slate-700">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.feature2']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                <p className="text-slate-700">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.feature3']} />
                </p>
              </div>
            </div>

            <Button asChild variant="marketing" className="h-12 w-full rounded-full text-base" size="lg">
              <Link href="/organizations">
                <div className="flex items-center justify-center gap-2">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.button']} />
                  <ArrowRight size={16} />
                </div>
              </Link>
            </Button>
          </div>

          <div className="relative flex items-center justify-center md:flex-col">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg">
              <span className="text-sm font-semibold text-slate-600">
                <FormattedMessage id="Or" defaultMessage="OR" />
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="relative mb-6">
              <div className="absolute right-0 -bottom-1 left-0 w-3/4">
                <NextImage
                  src="/static/images/subtitle-pink.png"
                  alt=""
                  width={720}
                  height={64}
                  className="w-full object-contain opacity-80"
                  aria-hidden
                />
              </div>
              <h3 className="relative mb-2 text-[2.5rem] font-bold text-oc">
                <FormattedMessage {...messages['home.solutions.unincorporated.title']} />
              </h3>
            </div>

            <p className="mb-4 text-xl font-semibold">
              <FormattedMessage {...messages['home.solutions.unincorporated.description']} />
            </p>

            <div className="mb-8 flex-grow space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                <p className="text-slate-700">
                  <FormattedMessage {...messages['home.solutions.unincorporated.feature1']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                <p className="text-slate-700">
                  <FormattedMessage {...messages['home.solutions.unincorporated.feature2']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                <p className="text-slate-700">
                  <FormattedMessage {...messages['home.solutions.unincorporated.feature3']} />
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="h-12 w-full rounded-full text-base" size="lg">
              <Link href="/signup/collective" className="flex items-center justify-center gap-2">
                <FormattedMessage {...messages['home.solutions.unincorporated.button']} />
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solutions;
