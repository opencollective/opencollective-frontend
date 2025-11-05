import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import Image from '@/components/Image';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/Carousel';

const messages = defineMessages({
  title: {
    defaultMessage: 'Testimonials',
    id: 'solutions.testimonials.title',
  },
});

const testimonials = [
  {
    paragraphs: [
      'The Open Collective platform is a critical part of how we operate. It streamlines our operations, saving us time and reducing administrative overhead. By automating many tasks related to managing financial contributions and expenses, we’re able to focus more attention on supporting our hosted collectives’ individual needs.',
      'The platform keeps our financial records accurate, timely, and transparent, helping us build trust within our community and enabling us to focus more on providing meaningful support.',
    ],
    author: 'Lauren Gardner',
    role: 'Executive Director',
    org: 'Open Source Collective',
    avatar: '/static/images/testimonials/lauren-gardner.png',
    orgLink: 'https://oscollective.org',
  },
  {
    paragraphs: [
      'Open Collective is essential to how we operate as a foundation. The platform allows us to support hundreds of grassroots and open-source communities with transparent budgets, accessible financial tools, and smooth cross-border grant distribution.',
      'Working with Ofico ensures that the platform continues to evolve with the needs of fiscal hosts and the communities they serve — it’s an indispensable partner in making collective financial infrastructure truly work at scale.',
    ],
    author: 'Jean-François De Hertogh',
    role: 'Executive Director',
    org: 'Open Collective Europe Foundation',
    avatar: '/static/images/testimonials/jf.png',
    orgLink: 'https://www.oceurope.org',
  },
  {
    paragraphs: [
      'Open Collective enables us to deliver valuable services to numerous collectives in a structured and automated way.',
      'Our communities appreciate how efficient and user-friendly the platform is, allowing them not only to fundraise but also to manage their budgets and expenses transparently.',
      'With frequent updates, the platform continues to make it easier for us to support our collectives and for them to work with greater clarity and simplicity.',
    ],
    author: 'Babette',
    avatar: '/static/images/testimonials/babette.png',
    org: 'All For Climate',
    orgLink: 'https://allforclimate.earth/',
  },
  {
    paragraphs: [
      'Open Collective has enabled us to distribute funds across community groups and collectives in transparent and clear ways.',
      'The platform has unlocked our capacity to build sustainable infrastructure for our work - peer to peer learning and action - in meaningful and sustainable ways.',
      'Furthermore the support we receive is thorough and consistent - we deeply appreciate the platform and the team.',
    ],
    author: 'Anna Garlands',
    avatar: '/static/images/testimonials/anna-garlands.jpeg',
    org: 'Huddlecraft',
    role: 'Co-Director',
    orgLink: 'https://www.huddlecraft.com/',
  },
  {
    paragraphs: [
      'Open Collective has democratised community organising, helping to build trust and foster collaboration and transparency across community led work.',
      'Our continued partnership with Open Collective has enabled our network of more than 600 fiscally hosted community groups worldwide to manage their finances with ease and reassurance, thus freeing up headspace to focus on front line impact and long term strategy.',
      "It's an easy to use platform and the Open Collective team are dedicated to ensuring that client feedback from our network is fed into further product design.",
    ],
    author: 'Esther Foreman',
    avatar: '/static/images/testimonials/esther-foreman.jpg',
    org: 'Social Change Nest',
    role: 'CEO and Chair of the Board',
    orgLink: 'https://thesocialchangenest.org',
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: (typeof testimonials)[0] }) => (
  <Card className="h-full">
    <CardContent className="flex-1 px-6">
      <blockquote>
        <div className="space-y-2">
          {testimonial.paragraphs.map(text => (
            <p key={text.slice(0, 12)} className="text-slate-600">
              {text}
            </p>
          ))}
        </div>
      </blockquote>
    </CardContent>
    <CardFooter className="px-6">
      <div className="flex items-center">
        <div className="relative mr-4 h-16 w-16 overflow-hidden rounded-full bg-slate-200">
          <Image
            src={testimonial.avatar}
            alt={testimonial.author}
            className="h-full w-full object-cover"
            fill
            sizes="64px"
            style={{ height: undefined }}
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">{testimonial.author}</div>
          <div className="text-sm text-slate-600">{testimonial.role}</div>
          <a href={testimonial.orgLink} className="text-sm text-slate-500 underline hover:text-slate-700">
            {testimonial.org}
          </a>
        </div>
      </div>
    </CardFooter>
  </Card>
);

const Testimonials = () => {
  return (
    <section className="relative pt-16 pb-30">
      <div className="absolute inset-0 overflow-hidden">
        <div className="mx-auto h-full max-w-[1400px]">
          <Image
            className="h-full w-full object-contain"
            alt=""
            src="/static/images/testimonials-bg.png"
            width={4096}
            height={1743}
            style={{ height: undefined }}
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Title */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-oc-blue-tints-900">
            <FormattedMessage {...messages.title} />
          </h2>
        </div>

        <div className="w-full px-12">
          <Carousel
            opts={{
              align: 'start',
            }}
            className="mx-auto w-full max-w-4xl"
          >
            <CarouselContent>
              {testimonials.map(testimonial => (
                <CarouselItem key={testimonial.author} className="basis-full lg:basis-1/2">
                  <div className="p-1">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
