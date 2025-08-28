import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import Image from '@/components/Image';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';

const messages = defineMessages({
  title: {
    defaultMessage: 'Testimonials',
    id: 'solutions.testimonials.title',
  },
});

const testimonials = [
  {
    id: 1,
    title: 'Streamlining our operations, saving us time and reducing administrative overhead.',
    body: "Open Collective keeps our financial records accurate, timely, and transparent, helping us build trust within our community. By automating many tasks related to managing financial contributions and expenses, we're able to focus on providing meaningful support to our hosted collectives.",
    author: 'Lauren Gardner',
    role: 'Executive Director',
    org: 'Open Source Collective',
    avatar: '/static/images/laurengardner.png',
    avatarWidth: 512,
    avatarHeight: 512,
    orgLink: 'https://oscollective.org',
  },
  {
    id: 2,
    title: 'Open Collective is essential to how we operate as a foundation.',
    body: "The platform allows us to support hundreds of grassroots and open-source communities with transparent budgets, accessible financial tools, and smooth cross-border grant distribution. It's an indispensable partner in making collective financial infrastructure truly work at scale.",
    author: 'Jean-François De Hertogh',
    role: 'Executive Director',
    org: 'Open Collective Europe Foundation',
    avatar: '/static/images/jf.png',
    avatarWidth: 384,
    avatarHeight: 512,
    orgLink: 'https://www.oceurope.org',
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: (typeof testimonials)[0] }) => (
  <Card className="h-full">
    <CardContent className="flex-1 px-6">
      <blockquote>
        <h3 className="mb-4 text-lg font-bold text-slate-900">{testimonial.title}</h3>
        <p className="text-slate-600">{testimonial.body}</p>
      </blockquote>
    </CardContent>
    <CardFooter className="px-6">
      <div className="flex items-center">
        <div className="mr-4 h-16 w-16 overflow-hidden rounded-full bg-slate-200">
          <Image
            src={testimonial.avatar}
            alt={testimonial.author}
            width={testimonial.avatarWidth}
            height={testimonial.avatarHeight}
            className="h-full w-full object-cover"
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
            className="h-full w-full object-cover"
            alt=""
            src="/static/images/testimonials-bg.png"
            width={4096}
            height={1743}
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

        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {testimonials.map(testimonial => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
