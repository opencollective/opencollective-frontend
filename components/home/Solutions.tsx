import React from 'react';
import { ArrowRight } from 'lucide-react';
import NextImage from 'next/image';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Button } from '@/components/ui/Button';
import Link from '../Link';

const messages = defineMessages({
  'home.solutions.title': {
    id: 'home.solutions.title',
    defaultMessage: 'Solutions for different financial needs',
  },
  'home.solutions.legallyIncorporated.title': {
    id: 'home.solutions.legallyIncorporated.title',
    defaultMessage: 'Legally Incorporated',
  },
  'home.solutions.legallyIncorporated.description': {
    id: 'home.solutions.legallyIncorporated.description',
    defaultMessage: 'Foundations, Non-Profits, Companies, Public Sector and Co-ops',
  },
  'home.solutions.legallyIncorporated.feature1': {
    id: 'home.solutions.legallyIncorporated.feature1',
    defaultMessage: 'Legally registered',
  },
  'home.solutions.legallyIncorporated.feature2': {
    id: 'home.solutions.legallyIncorporated.feature2',
    defaultMessage: 'Access to professional accounting',
  },
  'home.solutions.legallyIncorporated.feature3': {
    id: 'home.solutions.legallyIncorporated.feature3',
    defaultMessage: 'Access to legal advisors',
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
    <div className="relative mt-10 flex min-h-[600px] items-center justify-center px-4 py-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <NextImage
          width={1853}
          height={820}
          src="/static/images/blue-watercolor-bg.png"
          alt=""
          className="h-full w-full object-fill"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex max-w-6xl flex-col items-center">
        {/* Main Title */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl md:text-5xl">
            <FormattedMessage {...messages['home.solutions.title']} />
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="relative flex w-full max-w-5xl flex-col gap-8 md:flex-row">
          {/* Left Panel - Legally Incorporated */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            {/* Title with green underline */}
            <div className="relative mb-8">
              <div className="absolute right-0 -bottom-4 left-0 w-2/3">
                <NextImage
                  src="/static/images/subtitle-green.png"
                  alt=""
                  width={720}
                  height={64}
                  className="w-full object-contain"
                />
              </div>
              <h3 className="relative mb-2 text-xl font-bold text-oc-blue-tints-900 sm:text-4xl">
                <FormattedMessage {...messages['home.solutions.legallyIncorporated.title']} />
              </h3>
            </div>

            {/* Description */}
            <p className="mb-4 font-semibold">
              <FormattedMessage {...messages['home.solutions.legallyIncorporated.description']} />
            </p>

            {/* Features List */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <p className="text-sm text-gray-700">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.feature1']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <p className="text-sm text-gray-700">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.feature2']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <p className="text-sm text-gray-700">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.feature3']} />
                </p>
              </div>
            </div>

            {/* Button */}

            <Button asChild variant="marketing" className="w-full rounded-full">
              <Link href="/solutions">
                <div className="flex items-center justify-center gap-2">
                  <FormattedMessage {...messages['home.solutions.legallyIncorporated.button']} />
                  <ArrowRight size={16} />
                </div>
              </Link>
            </Button>
          </div>

          {/* Right Panel - Unincorporated */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            {/* Title with pink underline */}
            <div className="relative mb-8">
              <div className="absolute right-0 -bottom-4 left-0 w-2/3">
                <NextImage
                  src="/static/images/subtitle-pink.png"
                  alt=""
                  width={720}
                  height={64}
                  className="w-full object-contain"
                />
              </div>
              <h3 className="relative mb-2 text-xl font-bold text-oc sm:text-4xl">
                <FormattedMessage {...messages['home.solutions.unincorporated.title']} />
              </h3>
            </div>

            {/* Description */}
            <p className="mb-4 font-semibold">
              <FormattedMessage {...messages['home.solutions.unincorporated.description']} />
            </p>

            {/* Features List */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <p className="text-sm text-gray-700">
                  <FormattedMessage {...messages['home.solutions.unincorporated.feature1']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <p className="text-sm text-gray-700">
                  <FormattedMessage {...messages['home.solutions.unincorporated.feature2']} />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                <p className="text-sm text-gray-700">
                  <FormattedMessage {...messages['home.solutions.unincorporated.feature3']} />
                </p>
              </div>
            </div>

            {/* Button */}
            <Button variant="outline" className="w-full rounded-full" asChild>
              <Link href="/create" className="flex items-center justify-center gap-2">
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
