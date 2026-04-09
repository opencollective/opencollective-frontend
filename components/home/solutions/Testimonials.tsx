import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

import Image from '@/components/Image';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/Carousel';

const messages = defineMessages({
  title: {
    defaultMessage: 'Testimonials',
    id: 'solutions.testimonials.title',
  },
  goToTestimonial: {
    defaultMessage: 'Go to testimonial {index}',
    id: 'solutions.testimonials.goTo',
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

/**
 * Embla only keeps `loop: true` when slideLooper.canLoop() passes: roughly, the
 * track must be wide enough that the viewport is smaller than the sum of all
 * slides minus one. With fixed-width cards, wide viewports fail that check and
 * Embla silently turns looping off — so we repeat slides until the track is long enough.
 */
const LOOP_MIN_PHYSICAL_SLIDES = 24;

function getTestimonialLoopCopies(slideCount: number) {
  return Math.max(2, Math.ceil(LOOP_MIN_PHYSICAL_SLIDES / slideCount));
}

type LoopSlide = {
  testimonial: Testimonial;
  key: string;
};

function buildLoopSlides(testimonials: Testimonial[]): { slides: LoopSlide[]; startIndex: number; loop: boolean } {
  const len = testimonials.length;
  if (len <= 1) {
    return {
      slides: testimonials.map(t => ({ testimonial: t, key: t.linkUrl })),
      startIndex: 0,
      loop: false,
    };
  }
  const copies = getTestimonialLoopCopies(len);
  const slides = Array.from({ length: copies }, (_, copyIndex) =>
    testimonials.map(t => ({
      testimonial: t,
      key: `${t.linkUrl}__${copyIndex}`,
    })),
  ).flat();
  return {
    slides,
    startIndex: Math.floor(copies / 2) * len,
    loop: true,
  };
}

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <Card className="rounded-2xl border border-border/80 bg-card py-8 shadow-md">
    <CardContent className="flex-1 px-8">
      <blockquote>
        <div className="space-y-3">
          {testimonial.paragraphs.map(text => (
            <p key={text} className="text-base leading-relaxed text-muted-foreground">
              {text}
            </p>
          ))}
        </div>
      </blockquote>
    </CardContent>
    <CardFooter className="flex-col items-stretch gap-0 px-8 pt-2">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
          <Image
            src={testimonial.avatar}
            alt={testimonial.author}
            className="h-full w-full object-cover"
            fill
            sizes="56px"
            style={{ height: undefined }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-foreground">{testimonial.author}</div>
          {testimonial.role ? <div className="text-sm text-muted-foreground">{testimonial.role}</div> : null}
          <a
            href={testimonial.linkUrl}
            className="mt-1 inline-block text-sm text-slate-500 underline decoration-slate-400/60 underline-offset-2 transition-colors hover:text-slate-700"
          >
            {testimonial.linkLabel}
          </a>
        </div>
      </div>
    </CardFooter>
  </Card>
);

const TestimonialsCarousel = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const intl = useIntl();
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedLogical, setSelectedLogical] = React.useState(0);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const { slides: loopSlides, startIndex, loop } = React.useMemo(() => buildLoopSlides(testimonials), [testimonials]);
  const len = testimonials.length;

  const scrollToLogicalIndex = React.useCallback(
    (logicalIndex: number) => {
      if (!api || len <= 1) {
        return;
      }
      const copies = getTestimonialLoopCopies(len);
      const current = api.selectedScrollSnap();
      let bestPhysical = logicalIndex;
      let minDist = Infinity;
      for (let c = 0; c < copies; c++) {
        const physical = c * len + logicalIndex;
        const dist = Math.abs(physical - current);
        if (dist < minDist) {
          minDist = dist;
          bestPhysical = physical;
        }
      }
      api.scrollTo(bestPhysical);
    },
    [api, len],
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }
    const sync = () => {
      const physical = api.selectedScrollSnap();
      setSelectedLogical(len > 1 ? physical % len : 0);
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    sync();
    api.on('select', sync);
    api.on('reInit', sync);
    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api, len]);

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: 'center',
        duration: 25,
        dragFree: false,
        loop,
        startIndex,
      }}
      className="w-full"
    >
      {/* Fade carousel edges into the section background (mask: transparent = hidden). */}
      <div
        className={cn(
          'relative w-full',
          '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
        )}
      >
        <CarouselContent className="-ml-5 items-center">
          {loopSlides.map(({ testimonial, key }) => (
            <CarouselItem key={key} className="basis-auto pl-5">
              <div className="w-[min(calc(100vw-2rem),540px)]">
                <TestimonialCard testimonial={testimonial} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>

      {testimonials.length > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-border bg-background shadow-none"
            disabled={!canPrev}
            onClick={() => api?.scrollPrev()}
            aria-label={intl.formatMessage({
              defaultMessage: 'Previous slide',
              id: 'Carousel.PreviousSlide',
            })}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {testimonials.map((t, index) => (
              <button
                key={t.linkUrl}
                type="button"
                aria-label={intl.formatMessage(messages.goToTestimonial, { index: index + 1 })}
                aria-current={index === selectedLogical ? 'true' : undefined}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === selectedLogical
                    ? 'w-8 bg-oc-blue-tints-900'
                    : 'w-2 bg-slate-300 hover:bg-slate-400',
                )}
                onClick={() => scrollToLogicalIndex(index)}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-border bg-background shadow-none"
            disabled={!canNext}
            onClick={() => api?.scrollNext()}
            aria-label={intl.formatMessage({
              defaultMessage: 'Next slide',
              id: 'Carousel.NextSlide',
            })}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
    </Carousel>
  );
};

const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  return (
    <section className="relative w-full pt-16 pb-30">
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-full w-full">
          <Image
            className="h-full w-full object-contain object-center"
            alt=""
            src="/static/images/testimonials-bg.png"
            width={4096}
            height={1743}
            style={{ height: undefined }}
          />
        </div>
      </div>

      <div className="relative w-full">
        <div className="mb-12 px-4 text-center">
          <h2 className="text-4xl font-bold text-oc-blue-tints-900">
            <FormattedMessage {...messages.title} />
          </h2>
        </div>

        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
};

export default Testimonials;
