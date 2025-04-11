import React from 'react';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';

import { getTaxFormPDFServiceUrl } from '../../../../lib/url-helpers';
import { cn } from '../../../../lib/utils';

import Image from '../../../Image';

const TaxFormLoadingPlaceholder = (
  <Image src="/static/images/tax-form-placeholder.jpg" priority alt="" width={1200} height={1600} />
);

const PDFViewer = dynamic(() => import('../../../PDFViewer'), {
  ssr: false,
  loading: () => TaxFormLoadingPlaceholder,
});

const MemoizedTaxFormPreview = React.memo(({ url }: { url: string }) => {
  const contentWrapperRef = React.useRef(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [currentRender, setCurrentRender] = React.useState(() => ({
    url,
    time: Date.now(),
    result: (
      <PDFViewer
        loading={TaxFormLoadingPlaceholder}
        pdfUrl={url}
        contentWrapperRef={contentWrapperRef}
        errorTextColor="neutral.900"
        limitToPageWidth={false}
        onLoadSuccess={() => setIsInitialized(true)}
        onLoadError={() => setIsInitialized(true)}
      />
    ),
  }));

  const [nextRender, setNextRender] = React.useState(null);
  const hasPendingReRender = currentRender.url !== url;
  const debouncedSetNextRender = React.useMemo(() => debounce(setNextRender, 500), []);

  // Pre-load the next render
  React.useEffect(() => {
    if (hasPendingReRender && url !== nextRender?.url) {
      const newRender = { time: Date.now(), url, result: null };
      newRender.result = (
        <PDFViewer
          pdfUrl={url}
          loading={TaxFormLoadingPlaceholder}
          contentWrapperRef={contentWrapperRef}
          errorTextColor="neutral.900"
          limitToPageWidth={false}
          onLoadSuccess={() => {
            setIsInitialized(true);
            setCurrentRender(currentRender =>
              currentRender.url !== newRender.url && currentRender.time < newRender.time ? newRender : currentRender,
            );
          }}
          onLoadError={() => {
            setIsInitialized(true);
            setCurrentRender(currentRender =>
              currentRender.url !== newRender.url && currentRender.time < newRender.time ? newRender : currentRender,
            );
          }}
        />
      );

      debouncedSetNextRender(newRender);
    }
  }, [hasPendingReRender, debouncedSetNextRender, nextRender?.url, url]);

  return (
    <div ref={contentWrapperRef}>
      <div key={currentRender.time} className={cn({ 'blur-xs': hasPendingReRender || !isInitialized })}>
        {currentRender.result}
      </div>
      {hasPendingReRender && nextRender && nextRender.time !== currentRender.time && (
        <div key={nextRender.time} className="hidden">
          {nextRender.result}
        </div>
      )}
    </div>
  );
});

MemoizedTaxFormPreview.displayName = 'MemoizedTaxFormPreview';

/**
 * An inline preview of the tax form that supports being re-rendered with new values as they get typed in a form.
 * Renders are debounced to avoid overloading the server, and the previous render is replaced with the new one.
 */
export const TaxFormPreview = ({ type, values }) => {
  const url = getTaxFormPDFServiceUrl(type, values);
  return <MemoizedTaxFormPreview url={url} />;
};
