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

export type Testimonial = {
  paragraphs: string[];
  author: string;
  role?: string;
  linkLabel: React.ReactNode;
  avatar: string;
  linkUrl: string;
};

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
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
          <a href={testimonial.linkUrl} className="text-sm text-slate-500 underline hover:text-slate-700">
            {testimonial.linkLabel}
          </a>
        </div>
      </div>
    </CardFooter>
  </Card>
);

const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
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
